#include "common/text.h"
#include "emit/emit.h"
#include "ir/checker.h"

namespace {

std::vector<std::string> pieces(const std::string& list) {
  std::vector<std::string> found = {""};
  int depth = 0;
  for (char c : list) {
    depth += c == '<' ? 1 : c == '>' ? -1 : 0;
    if (c == ',' && depth == 0) found.push_back("");
    else found.back() += c;
  }
  return found;
}

}  // namespace

int sizeOf(const std::string& type) {
  std::string last = words(type).empty() ? "" : words(type).back();
  if (last == "char") return 1;
  if (last == "short") return 2;
  return last == "int" || last == "float" ? 4 : 8;
}

std::string Emitter::type(const std::string& text) const {
  if (text.empty()) return form("unknown");
  if (endsWith(text, "?")) return fill(form("nullable"), {{"type", type(text.substr(0, text.size() - 1))}});
  if (endsWith(text, "[]")) {
    std::string inner = type(text.substr(0, text.size() - 2));
    bool complex = inner.find(" | ") != std::string::npos || inner.find("=>") != std::string::npos;
    return fill(form("array"), {{"type", complex ? "(" + inner + ")" : inner}});
  }
  size_t open = text.find('<');
  std::string head = text.substr(0, open);
  std::map<std::string, std::string> args;
  if (open != std::string::npos) {
    std::vector<std::string> items = pieces(text.substr(open + 1, text.size() - open - 2));
    for (size_t i = 0; i < items.size(); i++) args[std::to_string(i)] = type(trim(items[i]));
  }
  const Json* entry = ontology.word(words(head).back());
  if (entry && entry->has("emit")) return fill(entry->str("emit"), args);
  std::vector<std::string> inner;
  for (size_t i = 0; i < args.size(); i++) inner.push_back(args.at(std::to_string(i)));
  return inner.empty() ? head : head + "<" + join(inner, ", ") + ">";
}

bool Emitter::whole(const Node& node) const {
  return node.kind == "INT" || integer(node.type);
}

std::string Emitter::word(const Decl& decl, const std::string& modifier) const {
  return decl.is(modifier) ? ontology.emit(modifier) + " " : "";
}

std::string Emitter::comment(const std::string& text) const {
  return ontology.comments().str("line") + " " + text + "\n";
}

std::string Emitter::comments(const Decl& decl) const {
  std::string out;
  for (const std::string& text : decl.comments) out += comment("[пользователь] " + text);
  if (decl.open()) out += comment("[virtual]");
  return out;
}

std::string Emitter::cast(const Node& node) {
  const Json* entry = ontology.word(words(typeText(node)).back());
  bool plain = typeText(node).find('[') != std::string::npos || !entry || !entry->has("cast");
  std::string inner = expr(node.kids.back(), true);
  std::string from = "cast:" + root(node.kids.back().type);
  return plain ? inner : fill(entry->str(from, entry->str("cast")), {{"0", inner}});
}

std::string Emitter::creation(const Node& node) {
  std::string made = typeText(node.kids[1]);
  const Json& entry = *ontology.word("new");
  const Json* head = ontology.word(made.substr(0, made.find('<')));
  if (node.kids[2].kind == "index") return fill(entry.str("array"), {{"0", type(made)}, {"1", expr(node.kids[2].kids[0])}});
  if (head && head->has("new")) return head->str("new");
  return fill(entry.str("emit"), {{"0", type(made)}, {"1", join(list(node.kids[2], false), ", ")}});
}
