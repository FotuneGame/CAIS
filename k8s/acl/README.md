# acl: Keycloak окружения

## Состав

| Параметр | Значение |
|---|---|
| Релизы | `acl-dev`, `acl-stage`, `acl-prod` |
| Namespace | `acl-<env>` |
| Узел | `core` |
| Charts | [keycloak](https://github.com/bitnami/charts/tree/main/bitnami/keycloak), [oauth2-proxy](https://github.com/oauth2-proxy/manifests) (официальный, 10.7.2) |
| Внутренний адрес | `keycloak.acl-<env>:8080/<env>/keycloak` |
| Веб-интерфейс | `https://platform.local/<env>/keycloak` |
| Вход администратора | Vault `acl/<env>/keycloak` |
| База | PostgreSQL `db-<env>`, Vault `db/<env>/keycloak` |
| Клиент `cais` | client credentials для CAIS, секрет — Vault `acl/<env>/cais`, создаёт Job `keycloak-config-cli` |
| Клиент `cais-ui` | вход пользователя в браузере для oauth2-proxy, секрет и ключ cookie — Vault `acl/<env>/oauth2` |
| oauth2-proxy | адрес `https://platform.local/<env>/oauth2`: сессия Keycloak для `mcp`, общие параметры — `values.yaml`, адреса окружения — `values-<env>.yaml` |

## Команды

- Для установки окружения: `./cluster.sh up --dev`
- Для просмотра журнала: `kubectl logs -n acl-dev statefulset/keycloak`

## Важно

- Своих томов нет, данные хранятся в PostgreSQL окружения.
- Без `db-<env>` Keycloak не запускается.
- Вход для mcp — `https://platform.local/<env>/oauth2/start?rd=/<env>/llama/`, пользователь realm `master` (например, администратор из Vault `acl/<env>/keycloak`); сессия хранится в cookie `_oauth2_<env>` до 30 дней (offline-токен) и обновляется каждые 50 мин.
- Запросы с заголовком `Authorization: Bearer` (токены клиента `cais` с `aud: cais-ui`, команда — в `cais/README.md`) проходят без cookie.
- oauth2-proxy доверяет CA `*.local` из ConfigMap `local-ca` (создаёт Ansible).
- Клиенты `cais` и `cais-ui` обновляются при каждом `helm upgrade` из `keycloakConfigCli.configuration` (`values.yaml`); ручные правки клиентов перезаписываются.
