# mcp: MCP-сервер CAIS

## Инструменты

| Имя | Аргументы | Назначение |
|---|---|---|
| `agents` | — | Агенты из `AGENTS` |
| `task_start` | `task`, `agent?` (`coder`), `wait?` (45 с) | Поручить задачу, вернуть результат или `id` |
| `task_result` | `id`, `agent?` | Состояние и результат задачи |
| `docs_search` | `query`, `limit?` | Факты EBRB; `reviewed: false` — не оценены экспертом |
| `docs_add` | `title`, `text` | Добавить документ в факты EBRB |
| `action_check` | `action` | Решение EBRB: `APPROVE` с гипотезой, `REFINE` или `ESCALATE` |
| `group_report` | `minutes?` (60) | Отчёт trace о поведении агентов |
| `audit_check` | — | Проверка цепочки хешей журнала |

## Защита

| Угроза | Решение |
|---|---|
| Нет OAuth | JWT Keycloak на каждый запрос; без него — 401 и ссылка на `/.well-known/oauth-protected-resource` (RFC 9728) |
| ID в URL | Один адрес `POST /`; `id` задачи — в аргументах, чужая задача не находится |
| Нет целостности | Две записи на вызов в `mcp_audit`: `hash = sha256(seq, time, user, tool, args, outcome, prev)` |
| Инъекции | `task_start` отклоняет задачу с признаками инъекции, ответы `docs_search` — в `<data>`, длина аргументов ограничена |

## Команды

- Для запуска без Keycloak: `AUTH_DISABLED=true npm start`
- Для тестов и проверки кода: `npm test`, `npm run lint`
- Для списка инструментов: `curl -sk https://platform.local/dev/mcp -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`

## Важно

- Подключение к llama.cpp — шаг 4 в [cais/README.md](../README.md#развёртывание): после входа через `https://platform.local/<env>/oauth2/start?rd=/<env>/llama/` заголовок не нужен, токен сессии подставляет oauth2-proxy; не включайте в llama.cpp «Use llama-server proxy» — тогда запросы идут без cookie.
- Вызовы coder, ebrb и trace идут через Kafka с токеном клиента `cais`; агенты — `AGENTS` через запятую.
- Только `replicas: 1`: иначе цепочка аудита разветвится (повтор `seq` даёт ошибку).
- Каждый вызов — событие `tool` в `cais.events`.
