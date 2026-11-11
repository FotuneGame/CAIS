# agent-example: образец агента CAIS

Цикл ReAct на llama.cpp с памятью в PostgreSQL; по этому образцу устроены `cais/agents/<имя>`.

## Модули

| Модуль | Назначение |
|---|---|
| `agent` | `POST /run` `{task}`: цикл до `MAX_STEPS` (5) шагов |
| `tools`, `calc` | Инструменты `time` и `calc` |
| `ontology` | Аксиомы формата ответа |
| `memory` | `agent_memories`: задача и ответ, 3 ближайшие записи попадают в запрос |
| `prompts` | `GET /prompts`, `PUT /prompts` `{name, text}`: `system`, `format` |

## Команды

- Для запуска с документацией на http://localhost:3000/docs: `AUTH_DISABLED=true npm start`
- Для проброса llama.cpp при локальном запуске: `kubectl port-forward -n llm-dev svc/llama 81:8080`
- Для тестов и проверки кода: `npm test`, `npm run lint`
- Для проброса из кластера: `kubectl port-forward -n app-dev svc/agent 3010:80`
- Для запроса: `curl -s localhost:3010/run -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"task":"Сколько будет 17*23?"}'`

## Развёртывание

| Шаг | Действие |
|---|---|
| 1 | Шаги 1–5 из [example/node](../node/README.md#развёртывание) — один раз на группу `main` |
| 2 | Проект `main/agent` в GitLab и push: `git init -b main && git remote add origin https://gitlab.local/main/agent.git && git add . && git commit -m init && git push -u origin main` |
| 3 | Pipeline: проверка, тесты, образ `registry.local/main/agent`; dev — сам, stage и prod — ручные `deploy-stage`, `deploy-prod` (prod — по тегу версии) |
| 4 | `kubectl apply -f deploy/argocd-<env>.yaml` |

## Важно

- Все запросы, кроме `/health` и `/metrics`, требуют токен Keycloak (клиент `cais`).
- Результаты инструментов и память передаются в LLM внутри `<data>…</data>`; признаки инъекции — событие `injection` в `cais.events`.
