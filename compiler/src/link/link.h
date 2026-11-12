#pragma once
#include <set>
#include <string>
#include <vector>
#include "settings/ontology.h"
#include "settings/settings.h"

struct Linker {
  const Settings& settings;
  const Project& project;
  const Ontology& ontology;
  bool tests = false;

  void prepare(const std::vector<std::string>& generated);
  std::string build() const;
  void publish() const;
  int script(const std::string& name, std::string& output) const;

 private:
  std::string manifest(const std::vector<std::string>& generated) const;
  void require(const std::string& name, std::set<std::string>& used) const;
};
