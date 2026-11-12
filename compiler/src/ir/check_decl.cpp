#include <algorithm>
#include <set>
#include "common/text.h"
#include "ir/checker.h"

bool Checker::known(const std::string& word) const {
  const Decl* decl = symbol(word);
  if ((decl && decl->typeLike()) || ontology.word(word)) return true;
  return owner && std::find(owner->generics.begin(), owner->generics.end(), word) != owner->generics.end();
}

void Checker::typeName(const std::string& type, int line) const {
  for (const std::string& word : words(type)) {
    if (!known(word)) throw fail(unit->file, line, "неизвестный тип " + word + ": объявите его в проекте, без кода — virtual class " + word + ";");
  }
}

void Checker::value(const Node& node, const std::string& expected, const Scope& names, const std::string& what) {
  std::string found = type(node, names);
  if (!fits(found, expected)) throw bad(node, what + ": ожидался тип " + expected + ", получен " + found);
}

void Checker::callable(const Decl& decl) {
  Scope names;
  for (const Decl& param : decl.params) {
    typeName(param.type, decl.line);
    if (param.hasValue) value(param.value, param.type, names, param.name);
    names[param.name] = param.type;
  }
  bool filled = false;
  for (const Node& kid : decl.body.kids) filled = filled || kid.kind != "note";
  bool contract = decl.open() || (owner && owner->kind == "interface");
  if (decl.open() && decl.hasBody && filled) {
    throw fail(unit->file, decl.line, decl.name + ": virtual пишет LLM — оставьте тело пустым {} или уберите virtual");
  }
  if (!decl.hasBody && !contract) {
    throw fail(unit->file, decl.line, decl.name + ": нет тела — напишите его или пометьте virtual, тогда реализацию напишет LLM");
  }
  if (!decl.hasBody || decl.open()) return;
  returns = decl.type.empty() ? "void" : decl.type;
  async = decl.is("async");
  statement(decl.body, names);
}

void Checker::declaration(const Decl& decl) {
  if (!decl.type.empty()) typeName(decl.type, decl.line);
  if (decl.typeLike()) {
    const Decl* before = owner;
    std::set<std::string> names;
    owner = &decl;
    for (const std::string& base : decl.bases) typeName(base, decl.line);
    for (const Decl& member : decl.members) {
      bool repeated = member.kind != "constructor" && !names.insert(member.name).second;
      if (repeated) throw fail(unit->file, member.line, "повторное имя " + member.name);
      declaration(member);
    }
    owner = before;
    return;
  }
  if (decl.code()) return callable(decl);
  Scope names;
  if (decl.hasValue && decl.open()) throw fail(unit->file, decl.line, decl.name + ": virtual пишет LLM — уберите значение или virtual");
  if (decl.hasValue && !decl.type.empty()) value(decl.value, decl.type, names, decl.name);
}

void Checker::run() {
  for (const Unit& item : program.units) {
    unit = &item;
    owner = nullptr;
    for (const Decl& decl : item.decls) declaration(decl);
  }
}

void check(const Program& program, const Ontology& ontology) {
  Checker checker{program, ontology, nullptr, nullptr, "", false};
  checker.run();
}
