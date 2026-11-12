#include <algorithm>
#include <filesystem>
#include "common/text.h"
#include "ir/ir.h"

bool Decl::is(const std::string& modifier) const {
  return std::find(modifiers.begin(), modifiers.end(), modifier) != modifiers.end();
}

bool Decl::typeLike() const {
  return kind == "class" || kind == "interface" || kind == "enum" || kind == "typedef";
}

bool Decl::code() const {
  return kind == "function" || kind == "method" || kind == "constructor";
}

bool Decl::open() const {
  return is("virtual");
}

std::string root(const std::string& type) {
  std::string text = type.substr(0, type.find('<'));
  return endsWith(text, "?") ? text.substr(0, text.size() - 1) : text;
}

bool Unit::marked(const Decl& decl) const {
  if (decl.open()) return true;
  for (const Decl& member : decl.members) {
    if (member.open()) return true;
  }
  for (const std::string& base : decl.bases) {
    auto found = symbols.find(root(base));
    if (found != symbols.end() && found->second != &decl && marked(*found->second)) return true;
  }
  return false;
}

bool Unit::open() const {
  for (const Import& item : imports) {
    if (item.open) return true;
  }
  for (const Decl& decl : decls) {
    if (marked(decl)) return true;
  }
  return false;
}

bool Unit::test() const {
  return endsWith(path, ".test");
}

std::vector<std::string> Unit::created() const {
  std::vector<std::string> files;
  for (const Import& item : imports) {
    if (item.open) files.push_back(item.target);
  }
  return files;
}

const Unit* Program::find(const std::string& path) const {
  for (const Unit& unit : units) {
    if (unit.path == path) return &unit;
  }
  return nullptr;
}
