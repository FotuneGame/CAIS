#include <algorithm>
#include <regex>
#include "common/error.h"
#include "common/text.h"
#include "settings/vocabulary.h"

namespace {

void literals(const Pattern& pattern, const Dictionary& dictionary, std::vector<std::string>& unknown) {
  bool known = dictionary.keywords.count(pattern.text) || dictionary.operators.count(pattern.text) ||
               std::find(dictionary.symbols.begin(), dictionary.symbols.end(), pattern.text) != dictionary.symbols.end();
  if (pattern.kind == Pattern::Literal && !known) unknown.push_back(pattern.text);
  for (const Pattern& part : pattern.parts) literals(part, dictionary, unknown);
}

void require(const std::set<std::string>& lexemes, const Json& section, const std::string& name) {
  std::vector<std::string> missing;
  for (const std::string& lexeme : lexemes) {
    if (!section.has(lexeme)) missing.push_back(lexeme);
  }
  if (!missing.empty()) throw fail("онтология: в разделе " + name + " нет лексем из tokens.def: " + join(missing, " "));
}

}  // namespace

void checkVocabulary(const Dictionary& dictionary, const Grammar& grammar, const Ontology& ontology) {
  std::vector<std::string> unknown;
  for (const auto& rule : grammar.rules) literals(rule.second, dictionary, unknown);
  if (!unknown.empty()) throw fail("grammar.def: лексем нет в tokens.def: " + join(unknown, " "));
  const Json& keywords = ontology.base().at("keywords");
  const Json& operators = ontology.base().at("operators");
  require(dictionary.keywords, keywords, "keywords");
  require(dictionary.operators, operators, "operators");
  for (const auto& item : keywords.fields) {
    if (!dictionary.keywords.count(item.first)) {
      throw fail("base.json, keywords: " + item.first + " — не ключевое слово из tokens.def: онтология описывает только лексемы языка");
    }
  }
  for (const auto& item : operators.fields) {
    bool lexeme = dictionary.operators.count(item.first) > 0;
    if (dictionary.keywords.count(item.first)) throw fail("base.json, operators: " + item.first + " — ключевое слово, его место в keywords");
    if (!lexeme) throw fail("base.json, operators: " + item.first + " — не оператор из tokens.def: онтология описывает только лексемы языка");
    if (!item.second.has("emit")) throw fail("base.json, operators: у " + item.first + " нет перевода emit");
  }
  require(dictionary.keywords, ontology.language.at("keywords"), "keywords файла llmc.json");
  require(dictionary.operators, ontology.language.at("operators"), "operators файла llmc.json");
}
