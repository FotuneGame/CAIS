# ebrb: база правил убеждения и факты

## Вывод

| Шаг | Что делается | Модуль |
|---|---|---|
| 1. Извлечение | LLM извлекает `{(Aᵢ, vᵢ, cᵢ)}` по схеме атрибутов, в контексте — проверенные факты | `extraction` |
| 2. Проверка схемы | тип, диапазон, обязательные и лишние атрибуты; ошибка — `REFINE` | `validation` |
| 3. План | действие из списка действий (или переданное `action`) | `plan` |
| 4. Сходство | `S̃ᵢᵏ = cᵢ · Sᵢᵏ`, `S = 1 − √(Σ(α − αᵏ)² / 2)` | `similarity` |
| 5. Активация | `ωₖ = ρₖ · θₖ Π S̃^δ̄ / Σ θₗ Π S̃^δ̄`, `δ̄ = δ / max δ` | `activation` |
| 6. Агрегация | аналитический ER → `{β₁…β_N, β_Θ}`, убеждения × полнота `Σcᵢ / |Aₖ|` | `reasoning` |
| 7. Конфликт | `C = Σ ωₖωₗ(1 − cos(βₖ, βₗ)) / Σ ωₖωₗ` | `conflict` |
| 8. Решение | `APPROVE` — `β_max ≥ τ_B`, `β_Θ ≤ τ_Θ`, `C ≤ τ_C`, действие безопасно (+ объяснение LLM); `REFINE` — `β_Θ > τ_Θ` или `C > τ_C`; иначе `ESCALATE` | `policy`, `explain` |

| Порог | Переменная | По умолчанию |
|---|---|---|
| `τ_B`, `τ_Θ`, `τ_C` | `CONFIDENCE_THRESHOLD`, `IGNORANCE_THRESHOLD`, `CONFLICT_THRESHOLD` | 0,65, 0,3, 0,3 |

## API

| Запрос | Kafka | Назначение |
|---|---|---|
| `POST /infer` `{input \| attributes, action?, thresholds?}` | `infer` | Вывод по тексту или готовым атрибутам |
| `GET`/`POST /base` | — | Выгрузка и загрузка базы `{attributes, actions, rules}` |
| `GET`/`POST /attributes`, `/actions`, `/rules`, `POST …/delete` | — | Атрибуты (`weight`, `referential`, `required`), действия (`safe`), правила |
| `POST /learn` `{samples}`, `POST /rules/review` `{id}` | — | Правила из данных (`reviewed: false`) и их проверка экспертом |
| `POST /facts` `{title, text}`, `POST /facts/import` | `facts.add` | Факты: части по ~800 символов в Elasticsearch `cais-facts` |
| `POST /facts/search` `{query, limit?, reviewedOnly?}`, `GET /facts` | `facts.search` | Поиск BM25 и список |
| `POST /facts/review` `{title}` | — | Проверка фактов экспертом |
| `GET /prompts`, `PUT /prompts` `{name, text}` | — | Промпты `extract`, `plan`, `explain` |

## Команды

- Для запуска с документацией на http://localhost:3000/docs: `AUTH_DISABLED=true npm start`
- Для тестов и проверки кода: `npm test`, `npm run lint`
- Для проброса из кластера: `kubectl port-forward -n app-dev svc/ebrb 3004:80`
- Для загрузки примера базы: `curl -s localhost:3004/base -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d @examples/base.json`
- Для вывода: `curl -s localhost:3004/infer -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"input":"удалить папку /etc"}'`

## Важно

- В коде нет заданных признаков: атрибуты, действия, правила и гипотезы — данные эксперта в PostgreSQL. Без правил при запуске загружается `volumes/app/<env>/ebrb/base.json`, файлы для импорта — `volumes/app/<env>/ebrb/facts`.
- coder выполняет шаг только при `APPROVE` и гипотезе `ALLOW`.
- Новые факты и обученные правила — `reviewed: false`; в извлечение (шаг 1) попадают только проверенные факты.
- Референтные значения не должны повторяться, убеждения правила — в 0..1 с суммой ≤ 1; иначе база отклоняется.
- Документы с признаками инъекции сохраняются с `injection: true` и не выдаются поиском.
