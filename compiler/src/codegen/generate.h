#pragma once
#include <mutex>
#include <string>
#include <vector>
#include "codegen/llm.h"
#include "ir/ir.h"
#include "settings/ontology.h"
#include "settings/settings.h"

struct Prompt {
  std::string system;
  std::string user;
};

struct Part {
  std::string path;
  std::string code;
};

struct Generator {
  const Settings& settings;
  const Project& project;
  const Program& program;
  const Ontology& ontology;
  Llm& llm;
  std::mutex log;
  std::vector<std::string> only;
  bool changed = false;

  std::string targetFile(const Unit& unit) const;
  std::vector<std::string> files(const Unit& unit) const;
  int translate() const;
  int generate();
  int repair(const std::string& errors);
  int status() const;
  void checkOnly() const;

 private:
  Prompt prompt(const Unit& unit) const;
  std::vector<std::string> scope(const Unit& unit) const;
  std::vector<Part> answer(const Unit& unit, const std::string& text) const;
  std::string cacheFile(const Unit& unit, const std::string& kind) const;
  std::string state(const Unit& unit, const std::string& sum) const;
  bool selected(const Unit& unit, const std::string& state) const;
  void remember(const Unit& unit, const std::string& sum) const;
  std::vector<std::string> problems(const std::vector<Part>& parts, const Unit& unit) const;
  void declared(const Decl& decl, const std::string& code, const Unit& unit, std::vector<std::string>& found) const;
  void imported(const Part& part, const std::vector<Part>& parts, const Unit& unit, std::vector<std::string>& found) const;
  void extra(const std::vector<Part>& parts, const Unit& unit, std::vector<std::string>& found) const;
  void save(const Unit& unit, const std::vector<Part>& parts) const;
  void write(const Unit& unit, const Prompt& prompt, const std::string& extra);
  void report(const std::string& text);
};

std::string cleanCode(const std::string& answer);
std::string stripComments(const std::string& code, const Json& rules);
