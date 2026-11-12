#include <cctype>
#include "common/text.h"
#include "emit/emit.h"

std::vector<std::string> Emitter::list(const Node& holder, bool nested) {
  std::vector<std::string> items;
  if (const Node* args = holder.find("args")) {
    for (const Node& item : args->kids) items.push_back(expr(item, nested));
  }
  return items;
}

std::string Emitter::expr(const Node& node, bool nested) {
  const std::string& kind = node.kind;
  if (kind == "FLOAT") return std::tolower((unsigned char)node.text.back()) == 'f' ? node.text.substr(0, node.text.size() - 1) : node.text;
  if (kind == "KEYWORD" || kind == "OPERATOR") return ontology.emit(node.text);
  if (kind == "initializer") return fill(form("list"), {{"items", join(list(node, false), ", ")}});
  if (node.kids.empty()) return node.text;
  if (kind == "size") return size(node.kids[1]);
  if (kind == "creation") return creation(node);
  if (kind == "postfix") return postfix(node);
  if (kind == "cast") return cast(node);
  if (kind == "sequence") {
    std::vector<std::string> items;
    for (const Node& item : node.kids) items.push_back(expr(item));
    return join(items, ", ");
  }
  std::string text;
  if (kind == "unary") text = ontology.emit(node.kids[0].text) + expr(node.kids[1], true);
  else if (kind == "assign") text = assign(node);
  else if (kind == "ternary") text = expr(node.kids[0], true) + " ? " + expr(node.kids[2], true) + " : " + expr(node.kids[4], true);
  else text = chain(node);
  return nested ? "(" + text + ")" : text;
}

std::string Emitter::chain(const Node& node) {
  std::string left = expr(node.kids[0], true);
  bool integers = whole(node.kids[0]);
  for (size_t i = 1; i + 1 < node.kids.size(); i += 2) {
    const Node& right = node.kids[i + 1];
    const Json& entry = *ontology.word(node.kids[i].text);
    if (right.kind == "target") {
      std::string name = typeText(right);
      auto found = unit.symbols.find(name);
      bool project = found != unit.symbols.end() && found->second->typeLike();
      left = fill(entry.str(project || !entry.has("basic") ? "emit" : "basic"), {{"0", left}, {"1", type(name)}});
      continue;
    }
    std::string value = expr(right, true);
    integers = integers && whole(right);
    if (integers && entry.has("integer")) left = fill(entry.str("integer"), {{"0", left}, {"1", value}});
    else left += " " + entry.str("emit") + " " + value;
  }
  return left;
}

std::string Emitter::assign(const Node& node) {
  std::string left = expr(node.kids[0], true);
  const std::string& sign = node.kids[1].text;
  const Json& division = *ontology.word("/");
  if (sign == "/=" && division.has("integer") && whole(node.kids[0]) && whole(node.kids[2])) {
    return left + " " + ontology.emit("=") + " " + fill(division.str("integer"), {{"0", left}, {"1", expr(node.kids[2], true)}});
  }
  return left + " " + ontology.emit(sign) + " " + expr(node.kids[2]);
}

std::string Emitter::size(const Node& inner) {
  if (inner.kind == "type" && !inner.builtin) return std::to_string(sizeOf(typeText(inner)));
  const Json& entry = *ontology.word("sizeof");
  std::string value = inner.kind == "type" ? typeText(inner) : expr(inner, true);
  return fill(entry.str("emit"), {{"0", value}});
}

std::string Emitter::postfix(const Node& node) {
  const Node& head = node.kids[0];
  std::string text = expr(head, true);
  for (size_t i = 1; i < node.kids.size(); i++) {
    const Node& item = node.kids[i];
    if (item.kind == "call") text += "(" + join(list(item, false), ", ") + ")";
    else if (item.kind == "index") text += "[" + expr(item.kids[0]) + "]";
    else if (item.kind == "access") text += "." + item.kids[0].text;
    else text += item.text;
  }
  return text;
}
