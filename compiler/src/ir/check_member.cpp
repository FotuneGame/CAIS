#include "ir/checker.h"

std::string Checker::type(const Node& node, const Scope& names) {
  node.type = infer(node, names);
  return node.type;
}

std::vector<std::string> Checker::arguments(const Node& call, const Scope& names) {
  std::vector<std::string> types;
  if (const Node* args = call.find("args")) {
    for (const Node& item : args->kids) types.push_back(type(item, names));
  }
  return types;
}

std::string Checker::result(const Decl& callee, const std::vector<std::string>& args, const Node& node) {
  size_t required = 0;
  for (const Decl& param : callee.params) required += param.hasValue ? 0 : 1;
  bool same = args.size() >= required && args.size() <= callee.params.size();
  for (size_t i = 0; same && i < args.size(); i++) same = fits(args[i], callee.params[i].type);
  if (!same && unit->strict) throw bad(node, "аргументы не подходят к " + header(callee));
  return callee.type.empty() ? "void" : callee.type;
}

std::string Checker::invoke(const Node& head, const Node& call, const Scope& names) {
  std::vector<std::string> args = arguments(call, names);
  const Decl* callee = owner ? memberOf(*owner, head.text) : nullptr;
  if (!callee) callee = symbol(head.text);
  if (callee && (callee->kind == "method" || callee->kind == "function")) return result(*callee, args, head);
  if (unit->strict) throw bad(head, "неизвестная функция " + head.text + ": объявите её в проекте, без тела — virtual");
  return "any";
}

std::string Checker::postfix(const Node& node, const Scope& names) {
  const Node& head = node.kids[0];
  bool call = head.kind == "IDENT" && node.kids[1].kind == "call" && !names.count(head.text);
  std::string current = call ? invoke(head, node.kids[1], names) : type(head, names);
  for (size_t next = call ? 2 : 1; next < node.kids.size(); next++) {
    const Node& item = node.kids[next];
    if (item.kind == "index") {
      type(item.kids[0], names);
      current = element(current);
    } else if (item.kind == "call") {
      arguments(item, names);
      current = "any";
    } else if (item.kind == "access") {
      current = member(node, next, current, names);
    }
  }
  return current;
}

std::string Checker::member(const Node& node, size_t& next, const std::string& base, const Scope& names) {
  const Node& item = node.kids[next].kids[0];
  bool called = next + 1 < node.kids.size() && node.kids[next + 1].kind == "call";
  const Decl* type = symbol(root(base));
  bool loose = !type || !type->typeLike() || type->kind == "typedef" || (type->open() && type->members.empty());
  if (loose) return "any";
  const Decl* found = memberOf(*type, item.text);
  if (!found) {
    if (unit->strict) throw bad(item, "у " + type->name + " нет члена " + item.text);
    return "any";
  }
  if (found->kind == "enumerator") return type->name;
  if (found->kind == "field") return found->type;
  return called ? result(*found, arguments(node.kids[++next], names), item) : "any";
}
