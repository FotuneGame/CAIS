#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

FLAGS="-std=c++17 -O2 -Wall -Wextra -Isrc -pthread"
SOURCES=$(find src -name '*.cpp')

if command -v g++ >/dev/null 2>&1; then
  case "$(uname -s)" in MINGW* | MSYS*) FLAGS="$FLAGS -static" ;; esac
  g++ $FLAGS $SOURCES -o llmc
elif command -v docker >/dev/null 2>&1; then
  echo "g++ не найден: собираю в контейнере gcc:14"
  docker run --rm -v "$PWD:/compiler" -w /compiler gcc:14 g++ $FLAGS -static $SOURCES -o llmc
else
  echo "Нужен g++ или Docker: sudo apt install g++" >&2
  exit 1
fi
echo "Собран $(pwd)/llmc"
