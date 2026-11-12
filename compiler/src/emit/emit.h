#pragma once
#include <set>
#include <string>
#include <vector>
#include "ir/ir.h"
#include "settings/ontology.h"

struct Emitter {
  const Unit& unit;
  const Program& program;
  const Ontology& ontology;
  bool outline = false;
  std::set<std::string> imports;

  std::string file();
  std::string body(const Decl& decl);

 private:
  std::string form(const std::string& name) const { return ontology.form(name); }
  std::string word(const Decl& decl, const std::string& modifier) const;
  std::string comment(const std::string& text) const;
  std::string comments(const Decl& decl) const;
  std::string type(const std::string& text) const;
  bool whole(const Node& node) const;
  std::vector<std::string> list(const Node& holder, bool nested);
  std::string expr(const Node& node, bool nested = false);
  std::string chain(const Node& node);
  std::string assign(const Node& node);
  std::string cast(const Node& node);
  std::string creation(const Node& node);
  std::string postfix(const Node& node);
  std::string size(const Node& inner);
  std::string block(const Node& node, int depth);
  std::string statement(const Node& node, int depth);
  std::string branch(const Node& node, int depth);
  std::string loop(const Node& node, int depth);
  std::string choice(const Node& node, int depth);
  std::string attempt(const Node& node, int depth);
  std::string local(const Node& node);
  std::string params(const Decl& decl);
  std::string value(const Decl& decl);
  std::string function(const Decl& decl);
  std::string member(const Decl& decl, const Decl& owner);
  std::string members(const Decl& decl);
  std::string bases(const Decl& decl, bool interfaces) const;
  std::string typeLike(const Decl& decl);
  std::string declaration(const Decl& decl);
  std::string header() const;
};

std::string emitUnit(const Unit& unit, const Program& program, const Ontology& ontology, bool outline = false);
int sizeOf(const std::string& type);
