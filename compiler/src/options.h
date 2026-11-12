#pragma once
#include <cstdlib>
#include <filesystem>
#include <string>
#include <vector>
#include "common/error.h"
#include "common/text.h"

struct Options {
  std::string project;
  std::string target;
  std::string config;
  int until = 8;
  bool changed = false;
  bool status = false;
  bool plain = false;
  std::vector<std::string> only;
};

inline std::vector<std::string> paths(const std::string& list) {
  std::vector<std::string> result;
  for (std::string path : split(replaceAll(list, "\\", "/"), ',')) {
    if (startsWith(path, "./")) path = path.substr(2);
    result.push_back(endsWith(path, ".llmc") ? path.substr(0, path.size() - 5) : path);
  }
  return result;
}

inline Options options(int argc, char** argv) {
  Options result;
  result.config = (std::filesystem::path(argv[0]).parent_path() / "config" / "compiler.json").generic_string();
  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg == "--config" && i + 1 < argc) result.config = argv[++i];
    else if (arg == "--until" && i + 1 < argc) result.until = std::atoi(argv[++i]);
    else if (arg == "--changed") result.changed = true;
    else if (arg == "--status") result.status = true;
    else if (arg == "--no-llm") result.plain = true, result.until = 6;
    else if (arg == "--only" && i + 1 < argc) result.only = paths(argv[++i]);
    else if (arg[0] == '-') result.until = 0;
    else if (result.project.empty()) result.project = arg;
    else if (result.target.empty()) result.target = arg;
    else result.until = 0;
  }
  if (result.target.empty() || result.until < 1 || result.until > 8) {
    throw fail("использование: llmc <проект> <целевой язык> [--until 1..8] [--no-llm] [--status] [--changed] [--only файл.llmc,...] [--config compiler.json]");
  }
  return result;
}
