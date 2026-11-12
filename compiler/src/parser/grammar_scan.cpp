#include <cctype>
#include "parser/grammar.h"

std::vector<std::string> scanGrammar(const std::string& text) {
  std::vector<std::string> items;
  for (size_t i = 0; i < text.size();) {
    unsigned char c = text[i];
    size_t from = i++;
    if (std::isspace(c)) continue;
    if (c == '\'') {
      while (i < text.size() && text[i] != '\'') i++;
      i++;
    } else if (std::isalnum(c) || c == '_' || c == '%') {
      while (i < text.size() && (std::isalnum((unsigned char)text[i]) || text[i] == '_')) i++;
    }
    items.push_back(text.substr(from, i - from));
  }
  return items;
}
