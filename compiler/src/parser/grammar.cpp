#include "parser/grammar.h"
#include <cctype>
#include "common/error.h"
#include "common/files.h"

namespace {

struct Loader {
  std::string path;
  std::vector<std::string> items;
  size_t pos = 0;

  bool peek(const std::string& item) const {
    return pos < items.size() && items[pos] == item;
  }

  std::string take() {
    if (pos >= items.size()) throw fail(path + ": грамматика оборвана");
    return items[pos++];
  }

  void expect(const std::string& item) {
    std::string found = take();
    if (found != item) throw fail(path + ": ожидалось " + item + ", найдено " + found);
  }

  Pattern atom() {
    std::string item = take();
    if (item == "(") {
      Pattern inner = choice();
      expect(")");
      return inner;
    }
    if (item[0] == '\'') return {Pattern::Literal, item.substr(1, item.size() - 2), {}};
    bool token = std::isupper((unsigned char)item[0]);
    return {token ? Pattern::Token : Pattern::Rule, item, {}};
  }

  Pattern item() {
    Pattern pattern = atom();
    if (peek("*") || peek("+")) return {Pattern::Repeat, take(), {pattern}};
    if (peek("?")) return {Pattern::Optional, take(), {pattern}};
    return pattern;
  }

  Pattern sequence() {
    Pattern pattern{Pattern::Sequence, "", {}};
    while (!peek("|") && !peek(")") && !peek(";")) pattern.parts.push_back(item());
    return pattern.parts.size() == 1 ? pattern.parts[0] : pattern;
  }

  Pattern choice() {
    Pattern pattern{Pattern::Choice, "", {sequence()}};
    while (peek("|")) {
      take();
      pattern.parts.push_back(sequence());
    }
    return pattern.parts.size() == 1 ? pattern.parts[0] : pattern;
  }
};

void verify(const Grammar& grammar, const Pattern& pattern, const std::string& path) {
  if (pattern.kind == Pattern::Rule && !grammar.rules.count(pattern.text)) {
    throw fail(path + ": нет правила " + pattern.text);
  }
  for (const Pattern& part : pattern.parts) verify(grammar, part, path);
}

}  // namespace

Grammar loadGrammar(const std::string& path) {
  Loader loader{path, scanGrammar(readFile(path)), 0};
  Grammar grammar;
  while (loader.pos < loader.items.size()) {
    std::string name = loader.take();
    if (name == "%start") {
      grammar.start = loader.take();
    } else if (name == "%fold") {
      while (!loader.peek(";")) grammar.fold.insert(loader.take());
    } else {
      loader.expect(":");
      grammar.rules[name] = loader.choice();
    }
    loader.expect(";");
  }
  for (const auto& rule : grammar.rules) verify(grammar, rule.second, path);
  if (!grammar.rules.count(grammar.start)) throw fail(path + ": нет начального правила %start");
  return grammar;
}
