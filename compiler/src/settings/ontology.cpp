#include "settings/ontology.h"
#include <algorithm>
#include <filesystem>
#include <set>
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"

namespace fs = std::filesystem;

const Json* Ontology::word(const std::string& name) const {
  if (base().at("keywords").has(name)) return &base().at("keywords").at(name);
  return base().at("operators").has(name) ? &base().at("operators").at(name) : nullptr;
}

std::string Ontology::emit(const std::string& name) const {
  const Json* entry = word(name);
  return entry ? entry->str("emit", name) : name;
}

std::string Ontology::meaning(const std::string& name) const {
  return language.at("keywords").at(name).str("about", language.at("operators").at(name).str("about"));
}

Ontology loadOntology(const std::string& dir, const std::string& target) {
  Ontology ontology;
  ontology.target = target;
  ontology.language = parseJson(readFile(dir + "/llmc.json"), dir + "/llmc.json");
  for (const auto& entry : fs::directory_iterator(dir + "/" + target)) {
    if (entry.path().extension() != ".json") continue;
    std::string file = entry.path().generic_string();
    std::string name = entry.path().stem().string();
    Json part = parseJson(readFile(file), file);
    std::vector<std::string> sections = {"about", "language", "packages", "rules"};
    if (name == "base") sections.insert(sections.end(), {"extensions", "scripts", "comments", "keywords", "operators", "templates"});
    for (const std::string& section : sections) {
      if (!part.has(section)) throw fail(file + ": нет раздела " + section);
    }
    if (part.str("language") != target) throw fail(file + ": language должен быть " + target);
    ontology.parts[name] = part;
  }
  if (ontology.base().list("extensions").empty()) throw fail(dir + "/" + target + "/base.json: нет раздела extensions");
  return ontology;
}
