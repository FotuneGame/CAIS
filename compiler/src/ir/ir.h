#pragma once
#include <map>
#include <string>
#include <vector>
#include "parser/ast.h"

struct Decl {
  std::string kind;
  std::string name;
  std::string type;
  bool exported = false;
  int line = 0;
  std::vector<std::string> comments;
  std::vector<std::string> modifiers;
  std::vector<std::string> bases;
  std::vector<std::string> generics;
  std::vector<Decl> params;
  std::vector<Decl> members;
  Node value;
  Node body;
  Node super;
  bool hasValue = false;
  bool hasBody = false;
  bool hasSuper = false;

  bool is(const std::string& modifier) const;
  bool typeLike() const;
  bool code() const;
  bool open() const;
};

struct Import {
  std::string name;
  std::string unit;
  std::string target;
  std::string file;
  int line = 0;
  bool open = false;
  std::vector<std::string> comments;
};

struct Unit {
  std::string path;
  std::string file;
  std::string digest;
  bool strict = true;
  std::vector<Import> imports;
  std::vector<Decl> decls;
  std::map<std::string, const Decl*> symbols;

  bool open() const;
  bool marked(const Decl& decl) const;
  bool test() const;
  std::vector<std::string> created() const;
};

struct Program {
  std::vector<Unit> units;

  const Unit* find(const std::string& path) const;
};

Unit buildUnit(const Node& root, const std::string& path);
Decl declOf(const Node& node);
std::string typeText(const Node& node);
std::string show(const Node& node);
std::string showStatement(const Node& node, int depth);
std::string root(const std::string& type);
std::string header(const Decl& decl);
void leaves(const Node& node, std::vector<std::string>& out);
std::vector<const Node*> parts(const Node& node);
