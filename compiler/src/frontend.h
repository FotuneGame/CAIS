#pragma once
#include <string>
#include <vector>
#include "ir/ir.h"
#include "parser/parser.h"
#include "settings/settings.h"

struct Frontend {
  const Settings& settings;
  const Project& project;
  std::string dump;
  std::vector<SourceFile> files;
  std::vector<Source> sources;
  std::vector<std::vector<Token>> tokens;
  std::vector<Node> trees;

  size_t preprocessAll();
  size_t lexAll();
  int parseAll();
  Program build() const;
};
