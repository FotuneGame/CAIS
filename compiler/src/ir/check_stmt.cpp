#include "ir/checker.h"
#include "ir/print.h"

void Checker::condition(const Node& node, const Scope& names) {
  std::string found = type(node, names);
  if (unit->strict && found != "bool" && found != "any") throw bad(node, "условие должно быть bool, получен " + found);
}

void Checker::local(const Node& node, Scope& names) {
  Decl decl = declOf(node);
  typeName(decl.type, node.line);
  for (size_t i = 0; i + 1 < node.kids.size(); i++) {
    if (node.kids[i].kind == "OPERATOR" && node.kids[i].text == "=") value(node.kids[i + 1], decl.type, names, decl.name);
  }
  names[decl.name] = decl.type;
}

void Checker::branch(const Node& node, const Scope& names) {
  Scope inner = names;
  statement(node, inner);
}

void Checker::loop(const Node& node, const Scope& names) {
  std::vector<const Node*> items = parts(node);
  Scope inner = names;
  if (!items[0]->kids.empty()) statement(items[0]->kids[0], inner);
  if (!items[1]->kids.empty()) condition(items[1]->kids[0], inner);
  if (!items[2]->kids.empty()) type(items[2]->kids[0], inner);
  statement(*items[3], inner);
}

void Checker::statement(const Node& node, Scope& names) {
  std::vector<const Node*> items = parts(node);
  const std::string& kind = node.kind;
  if (kind == "block") {
    Scope inner = names;
    for (const Node& kid : node.kids) statement(kid, inner);
  } else if (kind == "local") {
    local(node, names);
  } else if (kind == "exprstmt" || kind == "throw") {
    type(*items[0], names);
  } else if (kind == "delete") {
    type(node.kids[1], names);
  } else if (kind == "return") {
    if (!items.empty()) value(*items[0], returns, names, "return");
  } else if (kind == "if") {
    condition(*items[0], names);
    branch(*items[1], names);
    if (items.size() > 2) branch(items[2]->kids.back(), names);
  } else if (kind == "while" || kind == "dowhile") {
    condition(*items[kind == "while" ? 0 : 1], names);
    branch(*items[kind == "while" ? 1 : 0], names);
  } else if (kind == "for") {
    loop(node, names);
  } else if (kind == "switch") {
    type(*items[0], names);
    for (size_t i = 1; i < items.size(); i++) {
      bool labelled = items[i]->kids[0].text == "case";
      if (labelled) type(items[i]->kids[1], names);
      Scope inner = names;
      for (size_t j = labelled ? 3 : 2; j < items[i]->kids.size(); j++) statement(items[i]->kids[j], inner);
    }
  } else if (kind == "try") {
    for (const Node* item : items) {
      Scope inner = names;
      if (item->kind == "catch") {
        typeName(typeText(item->kids[1]), item->line);
        inner[item->kids[2].text] = typeText(item->kids[1]);
      }
      statement(item->kind == "block" ? *item : item->kids.back(), inner);
    }
  }
}
