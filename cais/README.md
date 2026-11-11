# cais: Collaboration AI System

## Проекты

| Папка | Сервис | Назначение | Хранение |
|---|---|---|---|
| [agents/coder](agents/coder/README.md) | `coder` | Агент-программист: пишет и запускает код в песочнице | PostgreSQL, `volumes/app/<env>/coder` |
| [mcp](mcp/README.md) | `mcp` | MCP-сервер для веб-интерфейса llama.cpp | PostgreSQL (аудит) |
| [ebrb](ebrb/README.md) | `ebrb` | База правил убеждения (EBRB) и факты | PostgreSQL, Elasticsearch, `volumes/app/<env>/ebrb` |
| [trace](trace/README.md) | `trace` | События агентов, отчёт, MACIE, Apriori | ClickHouse |
| [train/pre-traning](train/pre-traning/README.md) | `pre-training` | Дообучение .gguf на тексте | PostgreSQL, `volumes/app/<env>/train` |
| [train/fine-tunning](train/fine-tunning/README.md) | `fine-tuning` | Дообучение .gguf на диалогах | PostgreSQL, `volumes/app/<env>/train` |

Проект GitLab — `main/cais-<сервис>`, образ — `registry.local/main/cais-<сервис>`, Argo CD — `deploy/argocd-<env>.yaml`.

## Структура проекта

| Путь | Назначение |
|---|---|
| `src/app.module.ts` | `ConfigModule`, shared-модули, глобальные `ValidationPipe`, `LoggerInterceptor`, `AuthGuard`, `CoreModule` |
| `src/config/<имя>.config.ts` | Настройки через `registerAs` |
| `src/common/{guards,interceptors}` | `AuthGuard` и `@Public()`, журнал HTTP-запросов |
| `src/shared/<сервис>/` | `logger` (winston), `keycloak`, `kafka`, `bus-client`, `bus-server`, `health`, `metrics` и т. д. |
| `src/modules/<модуль>/` | `.module.ts`, `.controller.ts`, `.service.ts`, `dto/`, `entity/`, `types/`, `constants/` |
| `test/*.e2e-spec.ts` | Тесты без кластера |

## Связь между сервисами

Только через Kafka; HTTP-API — для людей, Swagger и llama.cpp.

| Кто → кому | Действия |
|---|---|
| coder → ebrb | `infer` (допуск шага), `facts.search` |
| mcp → ebrb | `infer`, `facts.search`, `facts.add` |
| mcp → trace | `report` |
| mcp → coder | `runs.start`, `runs.status` |
| все → trace | события в `cais.events` |

| Шаг | Что происходит |
|---|---|
| Запрос | `cais.<сервис>.requests`: `{id, replyTo, action, deadline, token, body}` |
| Проверка | токен клиента `cais`, `body` — тем же DTO, что и HTTP; просроченные запросы отбрасываются |
| Ответ | `{id, ok, data \| error}` в `cais.<вызывающий>.replies`, ожидание — `BUS_TIMEOUT_MS` (180 с) |

## Окружение

| Сервис | Адрес | Кто использует |
|---|---|---|
| PostgreSQL | `postgresql.db-<env>:5432`, Secret `postgresql-credentials` | coder, mcp, ebrb, pre-training, fine-tuning |
| ClickHouse | `clickhouse.db-<env>:8123`, Secret `clickhouse-credentials` | trace |
| Elasticsearch | `elasticsearch.db-<env>:9200` | ebrb |
| Kafka | `kafka.mb-<env>:9092` | все |
| Keycloak | `keycloak.acl-<env>:8080/<env>/keycloak`, клиент `cais`, Secret `cais-credentials` (Vault `acl/<env>/cais`) | все |
| llama.cpp | `llama.llm-<env>:8080/<env>/llama` | coder, ebrb |

## Команды

- Для развёртывания всех проектов: `./deploy.sh`
- Для отдельных окружений: `./deploy.sh --dev --stage`
- Для токена клиента `cais` на 1 час (переменная `TOKEN` в примерах `curl` проектов): `TOKEN=$(curl -sk https://platform.local/dev/keycloak/realms/master/protocol/openid-connect/token -d grant_type=client_credentials -d client_id=cais --data-urlencode "client_secret=$(kubectl get secret -n app-dev cais-credentials -o jsonpath='{.data.password}' | base64 -d)" | jq -r .access_token)`
- Для тестов всех проектов: `for d in agents/coder mcp ebrb trace train/pre-traning train/fine-tunning; do (cd $d && npm ci && npm test); done`
- Для проверки подов: `kubectl get pods -n app-dev`

## Развёртывание

| Шаг | Действие |
|---|---|
| 1 | Один раз: Runner, `GITOPS_TOKEN`, `vcs/registry`, `cicd/argocd-gitlab` — как для `example/node` |
| 2 | `./cluster.sh up` (Vault, клиент Keycloak `cais`) и `./cluster.sh ports open` |
| 3 | `./deploy.sh`: push в GitLab, затем по окружениям dev → stage → prod ждёт `imageTag`, применяет Application Argo CD, ждёт под и проверяет `tools/list` у mcp |
| 4 | Вход: https://platform.local/dev/oauth2/start?rd=/dev/llama/ (Keycloak), затем в llama.cpp Settings → MCP servers → `https://platform.local/dev/mcp` без заголовков: токен сессии подставляет oauth2-proxy |

## Важно

- Запуск в Ubuntu/WSL: нужны `git config --global user.name`, `user.email` и доверие к CA `*.local` (команда в корневом `README.md`).
- Вход в GitLab: в WSL без своего `credential.helper` скрипт берёт Git Credential Manager из Windows — тот же вход, что при `git push` из Windows (окно GCM один раз). Логин в терминале спрашивается, только если GCM нет; без вопроса — `GITLAB_TOKEN=<токен> ./deploy.sh`.
- stage и prod — ручные `deploy-stage` и `deploy-prod` в pipeline, скрипт ждёт до `PIPELINE_TIMEOUT` (1800 с).
- Без токена Keycloak доступны только `/health` и `/metrics` внутри кластера; снаружи `llama` и `mcp` требуют сессию Keycloak или `Authorization: Bearer`.
- Таблицы, индексы и топики сервисы создают сами при запуске.
- Новый агент — проект `agents/<имя>` по образцу `agents/coder` (обработчики `runs.start`, `runs.status`), имя — в `AGENTS` у mcp, строка — в `PROJECTS` в `deploy.sh`.
- В папках проектов свой `.git`: не добавляйте `cais/` в корневой репозиторий.
