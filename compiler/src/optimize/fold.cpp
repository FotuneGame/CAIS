#include <cmath>
#include <iomanip>
#include <sstream>
#include "optimize/optimize.h"

namespace {

bool number(const Node& node) {
  bool literal = node.kind == "INT" || node.kind == "FLOAT";
  return literal && node.text.find_first_not_of("0123456789.") == std::string::npos;
}

bool every(const Node& node, bool (*operand)(const Node&), const std::string& operators) {
  for (size_t i = 0; i < node.kids.size(); i++) {
    bool same = i % 2 == 0 ? operand(node.kids[i]) : operators.find(node.kids[i].text) != std::string::npos;
    if (!same) return false;
  }
  return true;
}

bool text(const Node& node) {
  return node.kind == "STRING";
}

std::string numberText(double value, bool real) {
  if (!real) return std::to_string((long long)value);
  std::ostringstream out;
  out << std::setprecision(15) << value;
  return out.str().find_first_of(".e") == std::string::npos ? out.str() + ".0" : out.str();
}

bool compute(const Node& node, std::string& kind, std::string& result) {
  double value = std::stod(node.kids[0].text);
  bool real = node.kids[0].kind == "FLOAT";
  for (size_t i = 1; i + 1 < node.kids.size(); i += 2) {
    char op = node.kids[i].text[0];
    double right = std::stod(node.kids[i + 1].text);
    if (right == 0 && (op == '/' || op == '%')) return false;
    real = real || node.kids[i + 1].kind == "FLOAT";
    if (op == '+') value += right;
    else if (op == '-') value -= right;
    else if (op == '*') value *= right;
    else if (op == '%') value = std::fmod(value, right);
    else value = real ? value / right : std::trunc(value / right);
  }
  kind = real ? "FLOAT" : "INT";
  result = numberText(value, real);
  return true;
}

}  // namespace

void foldConstants(Node& node, int& count) {
  for (Node& kid : node.kids) foldConstants(kid, count);
  std::string kind, result;
  bool math = node.kind == "sum" || node.kind == "product";
  if (node.kind == "unary" && node.kids[0].text == "-" && number(node.kids[1])) {
    kind = node.kids[1].kind;
    result = "-" + node.kids[1].text;
  } else if (math && every(node, number, "+-*/%")) {
    compute(node, kind, result);
  } else if (node.kind == "sum" && every(node, text, "+")) {
    kind = "STRING";
    for (size_t i = 0; i < node.kids.size(); i += 2) result += node.kids[i].text.substr(1, node.kids[i].text.size() - 2);
    result = "\"" + result + "\"";
  }
  if (kind.empty()) return;
  node = Node{kind, result, node.file, node.line, {}, "", false};
  count++;
}

void dropUnreachable(Node& node, int& count) {
  for (Node& kid : node.kids) dropUnreachable(kid, count);
  if (node.kind != "block" && node.kind != "case") return;
  for (size_t i = 0; i + 1 < node.kids.size(); i++) {
    const std::string& kind = node.kids[i].kind;
    if (kind != "return" && kind != "break" && kind != "continue" && kind != "throw") continue;
    count += (int)(node.kids.size() - i - 1);
    node.kids.resize(i + 1);
  }
}
