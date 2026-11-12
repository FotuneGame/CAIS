#include "lexer/lexer.h"
#include "common/error.h"

namespace {

std::string wordKind(const Dictionary& dictionary, const std::string& text, const std::string& fallback) {
  if (dictionary.keywords.count(text)) return "KEYWORD";
  return dictionary.operators.count(text) ? "OPERATOR" : fallback;
}

Token next(const Line& line, size_t pos, const Dictionary& dictionary, bool& skip) {
  Token best{"", "", line.file, line.number, false};
  for (const TokenRule& rule : dictionary.rules) {
    std::smatch found;
    auto flags = std::regex_constants::match_continuous;
    bool matched = std::regex_search(line.text.begin() + pos, line.text.end(), found, rule.pattern, flags);
    if (!matched || (size_t)found.length() <= best.text.size()) continue;
    best.kind = wordKind(dictionary, found.str(), rule.name);
    best.text = found.str();
    skip = rule.skip;
  }
  for (const std::string& symbol : dictionary.symbols) {
    if (symbol.size() <= best.text.size() || line.text.compare(pos, symbol.size(), symbol) != 0) continue;
    best.kind = wordKind(dictionary, symbol, "PUNCT");
    best.text = symbol;
    skip = false;
  }
  if (best.text.empty()) {
    throw fail(line.file, line.number, "неизвестный символ " + line.text.substr(pos, 1));
  }
  return best;
}

void push(std::vector<Token>& tokens, Token token) {
  bool shift = token.kind == "OPERATOR" && (token.text == ">>" || token.text == ">>=");
  if (!shift) {
    tokens.push_back(token);
    return;
  }
  Token rest = token;
  rest.text = token.text.substr(1);
  rest.glued = true;
  token.text = ">";
  tokens.push_back(token);
  tokens.push_back(rest);
}

}  // namespace

std::vector<Token> lex(const Source& source, const Dictionary& dictionary) {
  std::vector<Token> tokens;
  for (const Line& line : source.lines) {
    size_t pos = 0;
    while (pos < line.text.size()) {
      bool skip = false;
      Token token = next(line, pos, dictionary, skip);
      pos += token.text.size();
      if (!skip) push(tokens, token);
    }
  }
  Token end{"END", "", "", 0, false};
  if (!tokens.empty()) {
    end.file = tokens.back().file;
    end.line = tokens.back().line;
  }
  tokens.push_back(end);
  return tokens;
}
