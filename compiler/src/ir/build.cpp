#include "common/text.h"
#include "ir/ir.h"

namespace {

void decorate(Decl& decl, const Node& node) {
  for (const Node* item : node.all("COMMENT")) decl.comments.push_back(trim(item->text.substr(2)));
  for (const Node* item : node.all("modifier")) decl.modifiers.push_back(item->kids[0].text);
  for (const Node& kid : node.kids) decl.exported = decl.exported || (kid.kind == "KEYWORD" && kid.text == "export");
}

Decl wrapped(const Node& node) {
  Decl decl = declOf(node.kids.back());
  Decl outer;
  decorate(outer, node);
  decl.comments = outer.comments;
  decl.exported = outer.exported;
  decl.modifiers.insert(decl.modifiers.begin(), outer.modifiers.begin(), outer.modifiers.end());
  return decl;
}

}  // namespace

Decl declOf(const Node& node) {
  Decl decl;
  decl.kind = node.kind;
  decl.line = node.line;
  decorate(decl, node);
  if (const Node* type = node.find("type")) decl.type = typeText(*type);
  if (const Node* name = node.find("IDENT")) decl.name = name->text;
  if (const Node* bases = node.find("bases")) {
    for (const Node* base : bases->all("base")) decl.bases.push_back(typeText(*base->find("type")));
  }
  if (const Node* generics = node.find("generics")) {
    for (const Node* item : generics->all("IDENT")) decl.generics.push_back(item->text);
  }
  if (const Node* params = node.find("params")) {
    for (const Node* param : params->all("param")) decl.params.push_back(declOf(*param));
  }
  for (const Node* member : node.all("member")) decl.members.push_back(wrapped(*member));
  for (const Node* item : node.all("enumerator")) decl.members.push_back(declOf(*item));
  for (size_t i = 0; i + 1 < node.kids.size(); i++) {
    if (node.kids[i].kind != "OPERATOR" || node.kids[i].text != "=") continue;
    decl.value = node.kids[i + 1];
    decl.hasValue = true;
  }
  if (const Node* body = node.find("block")) {
    decl.body = *body;
    decl.hasBody = true;
  }
  if (const Node* super = node.find("super")) {
    decl.super = *super;
    decl.hasSuper = true;
  }
  return decl;
}

Unit buildUnit(const Node& root, const std::string& path) {
  Unit unit;
  unit.path = path;
  unit.file = root.file;
  for (const Node& node : root.kids) {
    if (node.kind == "declaration") unit.decls.push_back(wrapped(node));
    if (node.kind != "import") continue;
    const std::string& name = node.kids.back().text;
    Import item{name.substr(1, name.size() - 2), "", "", "", node.line, false, {}};
    for (const Node* note : node.all("COMMENT")) item.comments.push_back(trim(note->text.substr(2)));
    for (const Node& kid : node.kids) item.open = item.open || kid.text == "virtual";
    unit.imports.push_back(item);
  }
  return unit;
}
