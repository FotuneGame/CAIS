#include "common/error.h"
#include "common/text.h"
#include "emit/emit.h"
#include "ir/print.h"

std::string Emitter::block(const Node& node, int depth) {
  std::string out = "{\n";
  if (node.kind != "block") out += statement(node, depth + 1);
  else for (const Node& kid : node.kids) out += statement(kid, depth + 1);
  return out + pad(depth) + "}";
}

std::string Emitter::local(const Node& node) {
  Decl decl = declOf(node);
  std::string value;
  for (size_t i = 0; i + 1 < node.kids.size(); i++) {
    if (node.kids[i].kind == "OPERATOR" && node.kids[i].text == "=") value = " = " + expr(node.kids[i + 1]);
  }
  std::string kind = decl.is("const") ? ontology.emit("const") : form("let");
  return fill(form("local"), {{"const", kind}, {"name", decl.name}, {"type", type(decl.type)}, {"value", value}});
}

std::string Emitter::branch(const Node& node, int depth) {
  std::vector<const Node*> items = parts(node);
  std::string out = ontology.emit("if") + " (" + expr(*items[0]) + ") " + block(*items[1], depth);
  if (items.size() < 3) return out;
  const Node& other = items[2]->kids.back();
  return out + " " + ontology.emit("else") + " " + (other.kind == "if" ? branch(other, depth) : block(other, depth));
}

std::string Emitter::loop(const Node& node, int depth) {
  std::vector<const Node*> items = parts(node);
  std::string head = ";";
  if (!items[0]->kids.empty()) {
    const Node& init = items[0]->kids[0];
    head = init.kind == "local" ? local(init) : expr(init.kids[0]) + ";";
  }
  head += items[1]->kids.empty() ? ";" : " " + expr(items[1]->kids[0]) + ";";
  head += items[2]->kids.empty() ? "" : " " + expr(items[2]->kids[0]);
  return ontology.emit("for") + " (" + head + ") " + block(*items[3], depth);
}

std::string Emitter::choice(const Node& node, int depth) {
  std::vector<const Node*> items = parts(node);
  std::string out = ontology.emit("switch") + " (" + expr(*items[0]) + ") {\n";
  for (size_t i = 1; i < items.size(); i++) {
    const Node& item = *items[i];
    bool labelled = item.kids[0].text == "case";
    out += pad(depth + 1) + (labelled ? ontology.emit("case") + " " + expr(item.kids[1]) : ontology.emit("default")) + ":\n";
    for (size_t j = labelled ? 3 : 2; j < item.kids.size(); j++) out += statement(item.kids[j], depth + 2);
  }
  return out + pad(depth) + "}";
}

std::string Emitter::attempt(const Node& node, int depth) {
  std::string out = ontology.emit("try");
  if (node.all("catch").size() > 1) throw fail(node.file, node.line, "несколько catch у одного try: оставьте один catch и проверяйте тип оператором is");
  for (const Node* item : parts(node)) {
    if (item->kind == "catch") out += " " + fill(form("catch"), {{"name", item->kids[2].text}});
    if (item->kind == "finally") out += " " + ontology.emit("finally");
    out += " " + block(item->kind == "block" ? *item : item->kids.back(), depth);
  }
  return out;
}

std::string Emitter::statement(const Node& node, int depth) {
  std::vector<const Node*> items = parts(node);
  const std::string& kind = node.kind;
  std::string text = ";";
  if (kind == "note") return pad(depth) + comment(trim(node.kids[0].text.substr(2)));
  if (kind == "block") text = block(node, depth);
  else if (kind == "if") text = branch(node, depth);
  else if (kind == "while") text = ontology.emit("while") + " (" + expr(*items[0]) + ") " + block(*items[1], depth);
  else if (kind == "dowhile") text = ontology.emit("do") + " " + block(*items[0], depth) + " " + ontology.emit("while") + " (" + expr(*items[1]) + ");";
  else if (kind == "for") text = loop(node, depth);
  else if (kind == "switch") text = choice(node, depth);
  else if (kind == "try") text = attempt(node, depth);
  else if (kind == "return") text = ontology.emit("return") + (items.empty() ? "" : " " + expr(*items[0])) + ";";
  else if (kind == "throw") text = ontology.emit("throw") + " " + expr(*items[0]) + ";";
  else if (kind == "delete") text = ontology.emit("delete") + " " + expr(node.kids[1]) + ";";
  else if (kind == "local") text = local(node);
  else if (kind == "exprstmt") text = expr(node.kids[0]) + ";";
  else if (kind == "break" || kind == "continue") text = ontology.emit(kind) + ";";
  return pad(depth) + text + "\n";
}
