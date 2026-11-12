#pragma once
#include <regex>
#include <set>
#include <string>
#include <vector>
#include "preprocess/preprocess.h"

struct TokenRule {
  std::string name;
  std::regex pattern;
  bool skip = false;
};

struct Dictionary {
  std::vector<TokenRule> rules;
  std::set<std::string> keywords;
  std::set<std::string> operators;
  std::vector<std::string> symbols;
};

struct Token {
  std::string kind;
  std::string text;
  std::string file;
  int line = 0;
  bool glued = false;
};

Dictionary loadDictionary(const std::string& path);
std::vector<Token> lex(const Source& source, const Dictionary& dictionary);
