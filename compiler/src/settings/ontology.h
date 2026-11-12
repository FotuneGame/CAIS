#pragma once
#include <map>
#include <string>
#include <vector>
#include "common/json.h"

struct Entry {
  const Json* json = nullptr;
  std::string part;
  std::string name;

  explicit operator bool() const { return json != nullptr; }
};

struct Ontology {
  std::string target;
  std::map<std::string, Json> parts;
  Json language;

  const Json& base() const { return parts.at("base"); }
  std::string extension() const { return base().list("extensions")[0]; }
  std::string form(const std::string& name) const { return base().at("templates").str(name); }
  const Json& comments() const { return base().at("comments"); }
  const Json* word(const std::string& name) const;
  std::string emit(const std::string& name) const;
  std::string meaning(const std::string& name) const;
};

Ontology loadOntology(const std::string& dir, const std::string& target);
