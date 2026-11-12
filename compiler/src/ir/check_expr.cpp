#include <cctype>
#include "ir/checker.h"

std::string Checker::infer(const Node& node, const Scope& names) {
  const std::string& kind = node.kind;
  if (kind == "INT") return "int";
  if (kind == "FLOAT") return std::tolower((unsigned char)node.text.back()) == 'f' ? "float" : "double";
  if (kind == "CHAR") return "char";
  if (kind == "STRING") return "string";
  if (kind == "IDENT") return name(node, names);
  if (kind == "KEYWORD") return node.text == "null" ? "any" : "bool";
  if (kind == "size") return size(node.kids[1], names);
  if (kind == "creation") return creation(node, names);
  if (kind == "postfix") return postfix(node, names);
  if (kind == "OPERATOR") {
    if (!owner) return "any";
    if (node.text == "this") return owner->name;
    return owner->bases.empty() ? "any" : bare(owner->bases[0]);
  }
  if (kind == "initializer") {
    std::vector<std::string> items = arguments(node, names);
    return (items.empty() ? "any" : items[0]) + "[]";
  }
  if (kind == "cast") {
    type(node.kids.back(), names);
    return typeText(node);
  }
  if (kind == "unary") {
    std::string inner = type(node.kids[1], names);
    if (node.kids[0].text == "await" && !async) throw bad(node, "await: объявите функцию async");
    if (node.kids[0].text == "await") return unwrap(inner);
    return node.kids[0].text == "!" ? "bool" : inner;
  }
  if (kind == "sequence") {
    std::string last;
    for (const Node& kid : node.kids) last = type(kid, names);
    return last;
  }
  std::string left = type(node.kids[0], names);
  if (kind == "assign") {
    std::string right = type(node.kids[2], names);
    if (!fits(right, left)) throw bad(node, "присваивание: ожидался тип " + left + ", получен " + right);
    return left;
  }
  if (kind == "ternary") {
    std::string yes = type(node.kids[2], names);
    std::string no = type(node.kids[4], names);
    if (!fits(yes, no) && !fits(no, yes)) throw bad(node, "ветви ? : разных типов: " + yes + " и " + no);
    return fits(yes, no) ? no : yes;
  }
  for (size_t i = 1; i + 1 < node.kids.size(); i += 2) {
    const Node& right = node.kids[i + 1];
    const std::string& op = node.kids[i].text;
    if (right.kind == "target") left = op == "is" ? "bool" : typeText(right);
    else left = combine(node, op, left, type(right, names));
  }
  return left;
}

std::string Checker::name(const Node& node, const Scope& names) {
  const std::string& text = node.text;
  if (names.count(text)) return names.at(text);
  const Decl* member = owner ? memberOf(*owner, text) : nullptr;
  if (member) return member->kind == "field" ? member->type : "any";
  if (const Decl* decl = symbol(text)) {
    if (decl->kind == "variable") return decl->type;
    return decl->typeLike() ? decl->name : "any";
  }
  if (unit->strict) throw bad(node, "неизвестное имя " + text + ": его нет в файле и импортах");
  return "any";
}

std::string Checker::combine(const Node& node, const std::string& op, const std::string& left,
                             const std::string& right) {
  const std::string& kind = node.kind;
  std::string pair = left + " " + op + " " + right;
  if (kind == "or" || kind == "and" || kind == "equal" || kind == "compare") {
    if (!fits(left, right) && !fits(right, left)) throw bad(node, "несовместимые типы: " + pair);
    return "bool";
  }
  if (op == "+" && (left == "string" || right == "string")) return "string";
  if (unit->strict && (!numeric(left) || !numeric(right))) throw bad(node, "оператор не применим: " + pair);
  if (left == "any" || right == "any") return "any";
  if (kind != "sum" && kind != "product") {
    if (unit->strict && (floating(left) || floating(right))) throw bad(node, "нужны целые операнды: " + pair);
    return left;
  }
  if (floating(left) || floating(right)) return left == "double" || right == "double" ? "double" : "float";
  return left == right ? left : "int";
}
