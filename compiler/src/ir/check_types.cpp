#include "common/text.h"
#include "ir/checker.h"

const Decl* Checker::symbol(const std::string& name) const {
  auto found = unit->symbols.find(name);
  return found == unit->symbols.end() ? nullptr : found->second;
}

const Decl* Checker::memberOf(const Decl& type, const std::string& name) const {
  for (const Decl& member : type.members) {
    if (member.name == name && member.kind != "constructor") return &member;
  }
  for (const std::string& base : type.bases) {
    const Decl* parent = symbol(root(base));
    const Decl* found = parent ? memberOf(*parent, name) : nullptr;
    if (found) return found;
  }
  return nullptr;
}

bool Checker::inherits(const std::string& from, const std::string& to) const {
  const Decl* decl = symbol(root(from));
  if (!decl) return false;
  for (const std::string& base : decl->bases) {
    if (bare(base) == to || root(base) == to || inherits(base, to)) return true;
  }
  return false;
}

bool Checker::fits(const std::string& source, const std::string& target) const {
  std::string from = bare(source);
  std::string to = bare(target);
  if (!unit->strict || from == to || from == "any" || to == "any") return true;
  for (const std::string& side : {from, to}) {
    const Decl* decl = symbol(root(side));
    if (decl && decl->typeLike() && decl->open() && decl->members.empty()) return true;
  }
  if (numeric(from) && numeric(to)) return !(floating(from) && integer(to));
  if (startsWith(to, "promise<")) return fits(from, unwrap(to));
  if (endsWith(from, "[]") && endsWith(to, "[]")) return fits(element(from), element(to));
  return inherits(from, to);
}

std::string Checker::creation(const Node& node, const Scope& names) {
  std::string made = typeText(node.kids[1]);
  typeName(made, node.line);
  if (node.kids[2].kind == "call") {
    arguments(node.kids[2], names);
    return made;
  }
  type(node.kids[2].kids[0], names);
  return made + "[]";
}

std::string Checker::size(const Node& inner, const Scope& names) {
  std::string name = inner.kind == "type" ? typeText(inner) : "";
  const Decl* decl = symbol(name);
  const Decl* member = owner ? memberOf(*owner, name) : nullptr;
  if (inner.kind != "type") {
    type(inner, names);
  } else if (names.count(name) || member || (decl && !decl->typeLike())) {
    inner.builtin = true;
    inner.type = names.count(name) ? names.at(name) : member ? member->type : decl->type;
  } else {
    typeName(name, inner.line);
  }
  return "int";
}
