# vscode: подсветка синтаксиса LLMC

## Файлы

| Файл | Назначение |
|---|---|
| `package.json` | описание расширения: язык `llmc`, файлы `.llmc` |
| `language-configuration.json` | комментарии, скобки, автозакрытие |
| `syntaxes/llmc.tmLanguage.json` | правила подсветки |
| `pack.py` | сборка пакета `llmc.vsix` |

## Подключение

| Шаг | Действие |
|---|---|
| 1 | собрать пакет: `python pack.py` |
| 2 | установить: `code --install-extension llmc.vsix` |
| 3 | перезапустить VS Code и открыть файл `.llmc`: язык в правом нижнем углу — `LLMC` |

## Команды

Команды выполняются из папки `compiler/addons/vscode`.

- Для сборки пакета: `python pack.py`
- Для установки: `code --install-extension llmc.vsix`
- Для проверки: `code --list-extensions` — в списке `cais.llmc`
- Для удаления: `code --uninstall-extension cais.llmc`

## Важно

- Копировать папку в `.vscode/extensions` вручную нельзя: VS Code загружает только расширения из своего реестра `extensions.json`.
- Установка без команд: `Ctrl+Shift+P` → `Extensions: Install from VSIX...` → выбрать `llmc.vsix`.
- После правки файлов расширения соберите и установите пакет заново.
- Если язык не определился: `Ctrl+Shift+P` → `Change Language Mode` → `LLMC`.
- В VS Code, подключённом к WSL, расширение ставится отдельно: та же команда установки в терминале WSL.
