# trace: поведение группы агентов

Читает события из Kafka `cais.events` в ClickHouse `cais_events` (хранение `KEEP_DAYS`, 30 дней) и анализирует их.

## API

| Запрос | Назначение |
|---|---|
| `POST /events` `{agent, type, ...}`, `POST /events/search` `{agent?, minutes?, limit?}` | Событие вручную, поиск |
| `POST /report` `{agent?, minutes?}`, Kafka `report` | Отчёт: показатели группы и аномалии |
| `POST /macie` `{minutes?, k?, b?, m?, epsilon?, synergy?, si?, shapley?, verbosity?, seed?}` | Причинный вклад агентов, коллективный интеллект, объяснение |
| `POST /apriori` `{minutes?, observations?, minSupport?, maxSize?, clusters?, expertPairs?, weights?}` | Связи факторов, снижающих производительность |

## Отчёт

| Показатель | Смысл |
|---|---|
| `toolDiversity`, `specialization` | Энтропия инструментов группы, различие агентов по инструментам |
| `synchrony` | Доля минут, когда активны несколько агентов |
| `slow_step`, `loop` | Шаг дольше среднего на 3σ, один инструмент 4 раза подряд |
| `violations` | Больше 30% шагов нарушают онтологию |
| `blocked_actions`, `failed_runs`, `injection` | Отказы EBRB, упавшие задачи, признаки инъекции |

## MACIE

| Шаг | Что делается | Модуль |
|---|---|---|
| История H | шаг — минута; `aᵢᵗ` — частое действие агента или `idle`; `rₜ` — награды событий; `sₜ` — знак `rₜ₋₁` | `macie/history` |
| 1. Модель | `rₜ = f_Y(sₜ, aₜ) + uₜ` (регрессия, R² на 20%, шум `uₜ` из H); рёбра `aᵢᵗ⁻¹ → aⱼᵗ` по G-тесту; `f_aⱼ(sₜ, Pa)` | `macie/model` |
| 2. Контрфактуалы | `do(aᵢ = π₀)`, реакция остальных `ãⱼᵗ ~ f_aⱼ(s̃ₜ, ãᵗ⁻¹)`, K повторов, критические моменты `|Yᵢ⁽ᵏ⁾(t) − Y_fact(t)| > ε` | `macie/effects` |
| 3. Вклад | `φᵢ = Y_fact − 1/K Σ Yᵢ⁽ᵏ⁾` | `macie/effects` |
| 3.5. Коллектив | `σᵢⱼ = Y(A) − Y(A∖{aᵢ, aⱼ}) − φᵢ − φⱼ`, `SI = (Y(A) − Σ Y({aᵢ})) / max(|Y(A)|, |Σ Y({aᵢ})|)`, `CS = 1/T Σ Corr(aₜ, aₜ₋₁)`, `II = Σ I(aᵢ; aⱼ | Pa(aᵢ, aⱼ))` | `macie/effects` |
| 4. Шепли | `φᵢ = Σ_C |C|!(N − |C| − 1)!/N! · [v(C ∪ {aᵢ}) − v(C)]`, `v(C) = Y(C) − Y(∅)`; N ≤ 10 — все коалиции, иначе M = ⌈N ln N⌉ | `macie/effects` |
| 5–6. Нормировка, ДИ | `φ̂ᵢ = φᵢ / Σ|φⱼ|`, ранжирование, бутстрэп B выборок шагов | `macie/macie`, `macie/numeric` |
| Эффективность | `v(A) = Σ φᵢ + ε`: `efficiency.residual` | `macie/macie` |
| 7. Объяснение | вклад и ДИ, критические моменты, эмерджентность (SI > `si`), синергия, контрфактуал для `argmax |φᵢ|`; `verbosity`: `concise`, `detailed`, `full` | `macie/macie` |

По умолчанию: `k` 10, `b` 200, `epsilon` 0,5, `synergy` 0,1, `si` 0,1, `shapley` true, `verbosity` `detailed`.

## Apriori

| Шаг | Что делается | Модуль |
|---|---|---|
| Наблюдения T | задача или минута агента; факторы `violation`, `blocked_action`, `failed_run`, `injection`, `slow_step`, `escalation`, `failed_job`; или свои `observations` | `apriori/apriori` |
| Поддержка | `supp(fᵢ, fⱼ) = ψ(fᵢ, fⱼ) / |T|`, матрица S, частые наборы с `supp ≥ minSupport`, граф G | `apriori/apriori` |
| Выбор методики | `m* = argmin δ(m)`, `δ = ω₁(1 − θ) + ω₂·WCSS` по `support`, `jaccard`, `lift`, `phi`; θ — каппа Коэна с `expertPairs` | `apriori/apriori` |

По умолчанию: `minSupport` 0,1, `maxSize` 3, `clusters` 2, `weights` [0,5, 0,5].

## Команды

- Для компиляции и запуска: [cais/README.md](../README.md#команды)
- Для проброса из кластера: `kubectl port-forward -n app-dev svc/trace 3005:80`
- Для MACIE за сутки: `curl -s localhost:3005/macie -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"minutes":1440}'`

## Важно

- В SI знаменатель по модулю: иначе при отрицательных исходах меняется знак; при выборке коалиций сумма Шепли делится на `Σ w(C)`.
- Награды событий — `src/macie/history.llmc`.
- Без `KAFKA_BROKERS` события принимает только `POST /events`; при недоступной Kafka потребитель переподключается каждые 10 с.
