#include "parser/parser.h"
#include "common/error.h"
#include "common/text.h"

namespace {

struct Parser {
  const Grammar& grammar;
  const std::vector<Token>& tokens;
  size_t far = 0;
  std::set<std::string> expected;

  bool miss(size_t pos, const std::string& what) {
    if (pos > far) expected.clear();
    if (pos >= far) {
      far = pos;
      expected.insert(what);
    }
    return false;
  }

  bool same(const Pattern& pattern, size_t pos, size_t& width) const {
    const Token& token = tokens[pos];
    if (pattern.kind == Pattern::Token) return token.kind == pattern.text;
    bool word = token.kind == "KEYWORD" || token.kind == "OPERATOR" || token.kind == "PUNCT";
    if (pattern.text != ">>" && pattern.text != ">>=") return word && token.text == pattern.text;
    const Token& second = tokens[pos + 1 < tokens.size() ? pos + 1 : pos];
    width = 2;
    return token.kind == "OPERATOR" && token.text == ">" && second.glued && second.text == pattern.text.substr(1);
  }

  bool leaf(const Pattern& pattern, size_t& pos, std::vector<Node>& out) {
    bool literal = pattern.kind == Pattern::Literal;
    while (pattern.text != "COMMENT" && tokens[pos].kind == "COMMENT") pos++;
    const Token& token = tokens[pos];
    size_t width = 1;
    if (!same(pattern, pos, width)) return miss(pos, literal ? "'" + pattern.text + "'" : pattern.text);
    if (token.kind != "PUNCT") out.push_back({token.kind, literal ? pattern.text : token.text, token.file, token.line, {}, "", false});
    if (token.kind != "END") pos += width;
    return true;
  }

  bool rule(const Pattern& pattern, size_t& pos, std::vector<Node>& out) {
    Node node{pattern.text, "", tokens[pos].file, tokens[pos].line, {}, "", false};
    if (!match(grammar.rules.at(pattern.text), pos, node.kids)) return false;
    bool fold = grammar.fold.count(pattern.text) && node.kids.size() == 1;
    out.push_back(fold ? node.kids[0] : node);
    return true;
  }

  bool repeat(const Pattern& pattern, size_t& pos, std::vector<Node>& out) {
    size_t count = 0;
    for (size_t before = pos; match(pattern.parts[0], pos, out) && pos > before; before = pos) count++;
    return count > 0 || pattern.text == "*";
  }

  bool match(const Pattern& pattern, size_t& pos, std::vector<Node>& out) {
    size_t start = pos;
    size_t size = out.size();
    bool matched = false;
    if (pattern.kind == Pattern::Token || pattern.kind == Pattern::Literal) {
      matched = leaf(pattern, pos, out);
    } else if (pattern.kind == Pattern::Rule) {
      matched = rule(pattern, pos, out);
    } else if (pattern.kind == Pattern::Repeat) {
      matched = repeat(pattern, pos, out);
    } else if (pattern.kind == Pattern::Optional) {
      match(pattern.parts[0], pos, out);
      matched = true;
    } else if (pattern.kind == Pattern::Choice) {
      for (const Pattern& part : pattern.parts) {
        if ((matched = match(part, pos, out))) break;
      }
    } else {
      matched = true;
      for (const Pattern& part : pattern.parts) {
        if (!(matched = match(part, pos, out))) break;
      }
    }
    if (matched) return true;
    pos = start;
    out.resize(size);
    return false;
  }
};

}  // namespace

Node parse(const Grammar& grammar, const std::vector<Token>& tokens) {
  Parser parser{grammar, tokens, 0, {}};
  std::vector<Node> out;
  size_t pos = 0;
  Pattern start{Pattern::Rule, grammar.start, {}};
  if (parser.match(start, pos, out) && tokens[pos].kind == "END") return out[0];
  const Token& token = tokens[parser.far];
  std::vector<std::string> expected(parser.expected.begin(), parser.expected.end());
  std::string found = token.kind == "END" ? "конец файла" : token.text;
  throw fail(token.file, token.line, "ожидалось " + join(expected, " или ") + ", найдено " + found);
}
