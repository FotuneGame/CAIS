#pragma once
#include <map>
#include <set>
#include <string>
#include <vector>

struct Pattern {
  enum Kind { Token, Literal, Rule, Sequence, Choice, Repeat, Optional };
  Kind kind = Sequence;
  std::string text;
  std::vector<Pattern> parts;
};

struct Grammar {
  std::map<std::string, Pattern> rules;
  std::set<std::string> fold;
  std::string start;
};

Grammar loadGrammar(const std::string& path);
std::vector<std::string> scanGrammar(const std::string& text);
