#include "common/text.h"
#include "ir/ir.h"

namespace {

std::string arguments(const Node& node) {
  std::vector<std::string> parts;
  if (const Node* args = node.find("args")) {
    for (const Node& item : args->kids) parts.push_back(show(item));
  }
  return join(parts, ", ");
}

std::string suffix(const Node& node) {
  if (node.kind == "call") return "(" + arguments(node) + ")";
  if (node.kind == "index") return "[" + show(node.kids[0]) + "]";
  if (node.kind == "access") return "." + node.kids[0].text;
  return node.text;
}

std::string chain(const Node& node) {
  std::string text = show(node.kids[0]);
  for (size_t i = 1; i + 1 < node.kids.size(); i += 2) {
    const Node& right = node.kids[i + 1];
    text = "(" + text + " " + node.kids[i].text + " " + (right.kind == "target" ? typeText(right) : show(right)) + ")";
  }
  return text;
}

}  // namespace

std::string typeText(const Node& node) {
  std::vector<std::string> words, inner;
  const Node* name = node.find("typename");
  for (const Node& kid : name ? name->kids : node.kids) {
    if (kid.kind == "basic" || kid.kind == "named") words.push_back(kid.kids[0].text);
    else if (name && kid.kind == "IDENT") words.push_back(kid.text);
  }
  std::string text = join(words, " ");
  for (const Node* item : node.all("type")) inner.push_back(typeText(*item));
  if (!inner.empty()) text += "<" + join(inner, ",") + ">";
  for (size_t i = 0; i < node.all("array").size(); i++) text += "[]";
  return node.find("optional") ? text + "?" : text;
}

std::string show(const Node& node) {
  if (node.kind == "initializer") return "{" + arguments(node) + "}";
  if (node.kind == "size") return "sizeof(" + (node.kids[1].kind == "type" ? typeText(node.kids[1]) : show(node.kids[1])) + ")";
  if (node.kind == "creation") return "new " + typeText(node.kids[1]) + suffix(node.kids[2]);
  if (node.kids.empty()) return node.text;
  if (node.kind == "cast") return "((" + typeText(node) + ") " + show(node.kids.back()) + ")";
  if (node.kind == "unary") return "(" + node.kids[0].text + (node.kids[0].text == "await" ? " " : "") + show(node.kids[1]) + ")";
  if (node.kind == "assign") return show(node.kids[0]) + " " + node.kids[1].text + " " + show(node.kids[2]);
  if (node.kind == "ternary") {
    return "(" + show(node.kids[0]) + " ? " + show(node.kids[2]) + " : " + show(node.kids[4]) + ")";
  }
  if (node.kind == "sequence") {
    std::vector<std::string> parts;
    for (const Node& item : node.kids) parts.push_back(show(item));
    return join(parts, ", ");
  }
  if (node.kind != "postfix") return chain(node);
  std::string text = show(node.kids[0]);
  for (size_t i = 1; i < node.kids.size(); i++) text += suffix(node.kids[i]);
  return text;
}

void leaves(const Node& node, std::vector<std::string>& out) {
  if (node.kids.empty() && !node.text.empty()) out.push_back(node.text);
  for (const Node& kid : node.kids) leaves(kid, out);
}
