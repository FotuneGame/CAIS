#include "common/text.h"
#include "ir/print.h"

namespace {

std::string nested(const Node& body, int depth) {
  return showStatement(body, body.kind == "block" ? depth : depth + 1);
}

std::string loopHead(const Node& node) {
  std::vector<const Node*> items = parts(node);
  const Node& init = *items[0];
  std::string text = ";";
  if (!init.kids.empty()) text = init.kids[0].kind == "local" ? header(declOf(init.kids[0])) : show(init.kids[0].kids[0]) + ";";
  text += items[1]->kids.empty() ? ";" : " " + show(items[1]->kids[0]) + ";";
  return text + (items[2]->kids.empty() ? "" : " " + show(items[2]->kids[0]));
}

std::string caseText(const Node& node, int depth) {
  bool labelled = node.kids[0].text == "case";
  std::string out = pad(depth) + (labelled ? "case " + show(node.kids[1]) : "default") + ":\n";
  for (size_t i = labelled ? 3 : 2; i < node.kids.size(); i++) out += showStatement(node.kids[i], depth + 1);
  return out;
}

std::string tryText(const Node& node, int depth) {
  std::string in = pad(depth);
  std::string out = in + "try\n";
  for (const Node* item : parts(node)) {
    if (item->kind == "catch") out += in + "catch (" + typeText(item->kids[1]) + " " + item->kids[2].text + ")\n";
    if (item->kind == "finally") out += in + "finally\n";
    out += showStatement(item->kind == "block" ? *item : item->kids.back(), depth);
  }
  return out;
}

}  // namespace

std::string showStatement(const Node& node, int depth) {
  std::string in = pad(depth);
  std::vector<const Node*> items = parts(node);
  if (node.kind == "note") return in + node.kids[0].text + "\n";
  if (node.kind == "block") {
    std::string out = in + "{\n";
    for (const Node& kid : node.kids) out += showStatement(kid, depth + 1);
    return out + in + "}\n";
  }
  if (node.kind == "if") {
    std::string out = in + "if (" + show(*items[0]) + ")\n" + nested(*items[1], depth);
    return items.size() < 3 ? out : out + in + "else\n" + nested(items[2]->kids.back(), depth);
  }
  if (node.kind == "while") return in + "while (" + show(*items[0]) + ")\n" + nested(*items[1], depth);
  if (node.kind == "dowhile") return in + "do\n" + nested(*items[0], depth) + in + "while (" + show(*items[1]) + ");\n";
  if (node.kind == "for") return in + "for (" + loopHead(node) + ")\n" + nested(*items[3], depth);
  if (node.kind == "switch") {
    std::string out = in + "switch (" + show(*items[0]) + ") {\n";
    for (size_t i = 1; i < items.size(); i++) out += caseText(*items[i], depth + 1);
    return out + in + "}\n";
  }
  if (node.kind == "try") return tryText(node, depth);
  if (node.kind == "return") return in + "return" + (items.empty() ? "" : " " + show(*items[0])) + ";\n";
  if (node.kind == "throw") return in + "throw " + show(*items[0]) + ";\n";
  if (node.kind == "delete") return in + "delete " + show(node.kids[1]) + ";\n";
  if (node.kind == "local") return in + header(declOf(node)) + "\n";
  if (node.kind == "exprstmt") return in + show(node.kids[0]) + ";\n";
  if (node.kind == "break" || node.kind == "continue") return in + node.kind + ";\n";
  return in + ";\n";
}
