#include "common/text.h"
#include "ir/print.h"

std::string pad(int depth) {
  return std::string(depth * 2, ' ');
}

namespace {

std::string callable(const Decl& decl, std::string text) {
  std::vector<std::string> params, args;
  for (const Decl& param : decl.params) params.push_back(header(param));
  text += "(" + join(params, ", ") + ")";
  if (!decl.hasSuper) return text;
  if (const Node* list = decl.super.find("args")) {
    for (const Node& item : list->kids) args.push_back(show(item));
  }
  return text + " : base(" + join(args, ", ") + ")";
}

}  // namespace

std::string header(const Decl& decl) {
  std::string start = decl.exported ? "export " : "";
  for (const std::string& modifier : decl.modifiers) start += modifier + " ";
  if (decl.kind == "typedef") return start + "typedef " + decl.type + " " + decl.name + ";";
  if (decl.kind == "enumerator") return decl.name + (decl.hasValue ? " = " + show(decl.value) : "");
  if (decl.typeLike()) {
    std::string generics = decl.generics.empty() ? "" : "<" + join(decl.generics, ", ") + ">";
    return start + decl.kind + " " + decl.name + generics + (decl.bases.empty() ? "" : " : " + join(decl.bases, ", "));
  }
  std::string text = start + (decl.type.empty() ? "" : decl.type + " ") + decl.name;
  if (decl.kind == "function" || decl.kind == "method" || decl.kind == "constructor") return callable(decl, text);
  if (decl.hasValue) text += " = " + show(decl.value);
  return decl.kind == "param" ? text : text + ";";
}

std::vector<const Node*> parts(const Node& node) {
  std::vector<const Node*> found;
  for (const Node& kid : node.kids) {
    if (kid.kind != "KEYWORD") found.push_back(&kid);
  }
  return found;
}
