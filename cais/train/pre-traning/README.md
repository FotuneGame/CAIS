# pre-training: дообучение .gguf на тексте

## Конвейер

| Шаг | Что делается | Модуль |
|---|---|---|
| Датасет | `.txt` или `.md` — сырой текст | `dataset` |
| База | модель из реестра или `<base>.gguf` (F16/F32) в `volumes/app/<env>/train/models` | `train` |
| Обучение | `llama-finetune`, аргументы — `LLAMA_FINETUNE_ARGS` | `llama`, `gguf` |
| Оценка | `llama-perplexity` до и после | `gguf` |
| Квантование | `llama-quantize` → `<model>-<тип>.gguf` | `gguf` |
| Реестр | PostgreSQL `train_models` | `models` |

По умолчанию: `context` 512, `batch` 512, `epochs` 2, `lr` 1e-5, `quantize` `Q4_K_M`, `evaluate` true. Переобучение — `base` = имя модели из реестра.

## API

| Запрос | Назначение |
|---|---|
| `GET /datasets`, `GET /bases`, `GET /models` | Датасеты, файлы .gguf, реестр |
| `POST /jobs` `{base, dataset, model, options?}` | Запустить обучение |
| `POST /jobs/status` `{id}`, `GET /jobs` | Ход (строки llama.cpp, метрики) и последние 50 заданий |

## Команды

- Для тестов без llama.cpp и проверки кода: `npm test`, `npm run lint`
- Для проброса из кластера: `kubectl port-forward -n app-dev svc/pre-training 3006:80`
- Для обучения: `curl -s localhost:3006/jobs -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"base":"Qwen3.5-4B-F16","dataset":"corpus.txt","model":"qwen-domain"}'`

## Важно

- Образ основан на `ghcr.io/ggml-org/llama.cpp:full`, бинарники — `LLAMA_BIN_DIR` (`/app`); потоки и слои GPU — `LLAMA_THREADS` (2), `LLAMA_GPU_LAYERS` (0).
- Под работает на узле окружения (лимит пода 3 ГБ) — только для малых моделей; для 4B F16 увеличьте `resources.limits.memory` и `environments.<env>.memory_gib` в `terraform/variables.tf`, для GPU — образ `full-cuda`.
- Другие ключи `llama-finetune` в вашей версии llama.cpp — задайте `LLAMA_FINETUNE_ARGS` в `deploy/values.yaml`.
- Квантованную модель для llama-server скопируйте в модели `k8s/llm`.
- Задание видно только владельцу; после перезапуска пода незавершённые получают `failed`.
