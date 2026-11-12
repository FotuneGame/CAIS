#pragma once
#include <map>
#include <string>
#include <vector>
#include "common/error.h"
#include "ir/ir.h"
#include "settings/ontology.h"
#include "settings/settings.h"

using Scope = std::map<std::string, std::string>;

std::string bare(const std::string& type);
std::string element(const std::string& type);
std::string unwrap(const std::string& type);
bool integer(const std::string& type);
bool floating(const std::string& type);
bool numeric(const std::string& type);

void resolve(Program& program, const std::string& extension);
void bind(Program& program);
void check(const Program& program, const Ontology& ontology);

struct Checker {
  const Program& program;
  const Ontology& ontology;
  const Unit* unit = nullptr;
  const Decl* owner = nullptr;
  std::string returns;
  bool async = false;

  void run();

 private:
  Error bad(const Node& node, const std::string& message) const { return fail(node.file, node.line, message); }
  const Decl* symbol(const std::string& name) const;
  const Decl* memberOf(const Decl& type, const std::string& name) const;
  bool inherits(const std::string& from, const std::string& to) const;
  bool fits(const std::string& from, const std::string& to) const;
  void typeName(const std::string& type, int line) const;
  bool known(const std::string& word) const;
  void callable(const Decl& decl);
  void declaration(const Decl& decl);
  void value(const Node& node, const std::string& expected, const Scope& names, const std::string& what);
  void statement(const Node& node, Scope& names);
  void branch(const Node& node, const Scope& names);
  void loop(const Node& node, const Scope& names);
  void local(const Node& node, Scope& names);
  void condition(const Node& node, const Scope& names);
  std::string type(const Node& node, const Scope& names);
  std::string infer(const Node& node, const Scope& names);
  std::string name(const Node& node, const Scope& names);
  std::string combine(const Node& node, const std::string& op, const std::string& left, const std::string& right);
  std::string creation(const Node& node, const Scope& names);
  std::string size(const Node& node, const Scope& names);
  std::string postfix(const Node& node, const Scope& names);
  std::string member(const Node& node, size_t& next, const std::string& base, const Scope& names);
  std::string invoke(const Node& head, const Node& call, const Scope& names);
  std::string result(const Decl& callee, const std::vector<std::string>& args, const Node& node);
  std::vector<std::string> arguments(const Node& call, const Scope& names);
};
