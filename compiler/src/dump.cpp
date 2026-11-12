#include "dump.h"

std::string dumpSource(const Source& source) {
  std::string out, file;
  for (const Line& line : source.lines) {
    if (line.file != file) out += "# " + line.file + "\n";
    file = line.file;
    out += std::to_string(line.number) + "\t" + line.text + "\n";
  }
  return out;
}

std::string dumpTokens(const std::vector<Token>& tokens) {
  std::string out;
  for (const Token& token : tokens) {
    out += std::to_string(token.line) + "\t" + token.kind + "\t" + token.text + "\n";
  }
  return out;
}

std::string dumpAst(const Node& node, int depth) {
  std::string out = std::string(depth * 2, ' ') + node.kind + (node.text.empty() ? "" : " " + node.text) + "\n";
  for (const Node& kid : node.kids) out += dumpAst(kid, depth + 1);
  return out;
}

int countNodes(const Node& node) {
  int count = 1;
  for (const Node& kid : node.kids) count += countNodes(kid);
  return count;
}
