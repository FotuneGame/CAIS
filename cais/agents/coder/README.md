# coder: агент-программист

Цель → план шагов → допуск EBRB → исполнение в песочнице → проверка → рефлексия → память.

## API

| Запрос | Kafka | Назначение |
|---|---|---|
| `POST /runs` `{task, wait?}` | `runs.start` | Задача; ждёт до `wait` с (максимум 50), иначе вернёт `id` |
| `POST /runs/status` `{id}` | `runs.status` | Состояние и результат |
| `GET /prompts`, `PUT /prompts` `{name, text}` | — | Промпты `goal`, `plan`, `check`, `retry`, `rules`, `repeat` |

## Инструменты агента

| Имя | Аргументы | Назначение |
|---|---|---|
| `list`, `read`, `write` | `path`, `content` | Файлы песочницы `app-data/sandbox/<id>` |
| `run` | `command` | Команда `sh` с таймаутом `COMMAND_TIMEOUT_MS` |
| `search` | `query` | Факты EBRB (`facts.search`) |

Память — таблица `coder_memories`: `task` (задача и ответ) и `lesson` (вывод рефлексии); в план попадают 3 ближайшие записи.

## Настройки

| Переменная | По умолчанию | В кластере |
|---|---|---|
| `LLM_URL` | `http://localhost:81/dev/llama` | llama.cpp окружения |
| `KAFKA_BROKERS` | пусто — допуск EBRB и поиск выключены | `kafka.mb-<env>:9092` |
| `MAX_STEPS`, `MAX_ATTEMPTS`, `COMMAND_TIMEOUT_MS` | `12`, `2`, `60000` | так же |
| `APP_DATA_PATH` | `./app-data` | `/app-data` → `volumes/app/<env>/coder` |

## Команды

- Для компиляции и запуска: [cais/README.md](../../README.md#команды)
- Для проброса из кластера: `kubectl port-forward -n app-dev svc/coder 3001:80`
- Для задачи: `curl -s localhost:3001/runs -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"task":"Напиши fizzbuzz и тест","wait":50}'`

## Важно

- Задача видна только владельцу: `sub` токена или `owner` от mcp.
- Шаг выполняется только при `APPROVE` и гипотезе `ALLOW` от EBRB; `REFINE`, `ESCALATE` и `BLOCK` возвращаются агенту как отказ с причиной.
- Задача, вывод инструментов и память передаются в LLM внутри `<data>…</data>`; признаки инъекции — событие `injection`.
- Пути вне песочницы отклоняет онтология.
- После перезапуска пода незавершённые задачи получают статус `failed`.
