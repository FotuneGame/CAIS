# llmc: компилятор языка LLMC

Переводит код на LLMC в целевой язык, собирает и запускает целевой проект. Код без `virtual` переводит сам компилятор, сущности с `virtual` создаёт LLM, заземлённая онтологией.

## Команды

- Для сборки компилятора: `./build.sh`
- Для компиляции и запуска проекта: `./llmc <путь до проекта> <целевой язык>`, например `./llmc example typescript`
- Для компиляции без запуска: `./llmc example typescript --until 7`
- Для проверки кода LLMC (этапы 1–5): `./llmc example typescript --until 5`
- Для перевода без LLM: `./llmc example typescript --no-llm`
- Для списка файлов, которые LLM допишет заново: `./llmc example typescript --status`
- Для генерации только файлов с изменённым кодом: `./llmc example typescript --changed`
- Для генерации выбранных файлов: `./llmc example typescript --only src/modules/note/note.service.llmc,src/main.llmc`
- Для своих настроек: `./llmc example typescript --config config/compiler.json`
- Для образа с компилятором и Node.js: `docker build -t llmc .`

## Кто пишет код

| Запись в LLMC | Кто переводит | Проверка |
|---|---|---|
| объявление без `virtual` | компилятор по `base.json` | типы на этапе 4, сборка и тесты на этапе 7 |
| `virtual` функция, метод, переменная | LLM по комментарию, имени и типам | имя и объявление есть в коде, сборка и тесты |
| `virtual class`, `virtual interface` | LLM оформляет и дополняет | имена членов на месте, тела человека не изменены |
| класс, наследующий `virtual interface` | LLM оформляет по комментарию интерфейса-роли | тела человека не изменены |
| `virtual import "путь";` | LLM создаёт файл целиком | файл создан, импорты только из пакетов онтологий |
| `import "файл не LLMC";` | файл переносится в целевой проект | файл существует |

## Этапы сборки

| Этап | Что делается | Результат |
|---|---|---|
| 1. Препроцессор | все комментарии остаются, лишние пробелы и табуляции убираются | `build/ir/<проект>/stages/*.pp` |
| 2. Лексер | токены по `config/tokens.def` | `build/ir/<проект>/stages/*.tokens` |
| 3. Парсер | AST по `config/grammar.def` | `build/ir/<проект>/stages/*.ast` |
| 4. IR | код LLMC с комментариями и пояснениями лексем из `config/ontologies/llmc.json`; проверка имён и типов | `build/ir/<проект>/units/*.ir` |
| 5. Оптимизация | свёртка констант, удаление недостижимого и неиспользуемого кода | — |
| 6. Генерация | перевод компилятора в целевой язык | `build/ir/<проект>/draft` |
| | ответы LLM для файлов с `virtual`, с комментариями | `build/ir/<проект>/llm` |
| | сверка с онтологией целевого языка, удаление комментариев | `build/code/<проект>` |
| 7. Линковка | остальные файлы проекта, зависимости и скрипты из онтологии, сборка и тесты | `build/bin/<проект>` |
| 8. Исполнение | скрипт `start` из онтологии | работающая программа |

## Онтологии

| Онтология | Файл | Описание |
|---|---|---|
| языка LLMC | `config/ontologies/llmc.json` | [config/ontologies/README.md](config/ontologies/README.md) |
| `typescript` | `config/ontologies/typescript` | [config/ontologies/typescript/README.md](config/ontologies/typescript/README.md) |

## Подключение LLM

Компилятор обращается к модели по сети: `POST <LLM_URL>/chat/completions` (API, совместимый с OpenAI).

| Переменная | Назначение |
|---|---|
| `LLM_URL` | адрес API |
| `LLM_MODEL` | имя модели |
| `LLM_TOKEN` | токен для заголовка `Authorization: Bearer`; без токена переменную не задавать |

Пример для .env:

```bash
LLM_URL=https://llm.example.com/v1 
LLM_MODEL=model-name 
LLM_TOKEN=<токен>
```

## Документация

| Тема | Файл |
|---|---|
| Лексемы и грамматика языка | [config/README.md](config/README.md) |
| Правила создания онтологии | [config/ontologies/README.md](config/ontologies/README.md) |
| Онтология TypeScript | [config/ontologies/typescript/README.md](config/ontologies/typescript/README.md) |
| Подсветка синтаксиса в VS Code | [addons/vscode/README.md](addons/vscode/README.md) |
