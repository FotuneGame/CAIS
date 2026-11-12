#include "emit/emit.h"
#include "ir/annotate.h"
#include <algorithm>
#include <filesystem>
#include <iostream>
#include "codegen/generate.h"
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"

std::string Generator::cacheFile(const Unit& unit, const std::string& kind) const {
  return settings.output("ir", project) + "/cache/" + unit.path + "." + kind;
}

std::vector<std::string> Generator::files(const Unit& unit) const {
  std::vector<std::string> found = {targetFile(unit)};
  if (!exists(cacheFile(unit, "files"))) return found;
  for (const std::string& file : split(readFile(cacheFile(unit, "files")), '\n')) {
    if (!file.empty()) found.push_back(file);
  }
  return found;
}

void Generator::save(const Unit& unit, const std::vector<Part>& parts) const {
  std::string code = settings.output("code", project) + "/";
  std::string list;
  for (const std::string& file : files(unit)) std::filesystem::remove(code + file);
  for (const Part& part : parts) {
    writeFile(code + part.path, part.code);
    if (&part != &parts[0]) list += part.path + "\n";
  }
  writeFile(cacheFile(unit, "files"), list);
}

std::string Generator::state(const Unit& unit, const std::string& sum) const {
  bool built = exists(settings.output("code", project) + "/" + targetFile(unit)) && exists(cacheFile(unit, "sum"));
  if (!built) return "новый";
  bool source = !exists(cacheFile(unit, "src")) || trim(readFile(cacheFile(unit, "src"))) == unit.digest;
  if (!source) return "изменён";
  return trim(readFile(cacheFile(unit, "sum"))) == sum ? "" : "изменилось окружение";
}

bool Generator::selected(const Unit& unit, const std::string& state) const {
  if (!only.empty()) return std::find(only.begin(), only.end(), unit.path) != only.end();
  if (changed) return state == "новый" || state == "изменён";
  return !state.empty();
}

void Generator::remember(const Unit& unit, const std::string& sum) const {
  writeFile(cacheFile(unit, "sum"), sum);
  writeFile(cacheFile(unit, "src"), unit.digest);
}

void Generator::checkOnly() const {
  for (const std::string& path : only) {
    const Unit* unit = program.find(path);
    if (!unit) throw fail("--only: в проекте нет файла " + path + ".llmc");
    if (!unit->open()) throw fail("--only: в " + path + ".llmc нет virtual — его переводит компилятор без LLM");
  }
}

int Generator::status() const {
  int count = 0, plain = 0;
  for (const Unit& unit : program.units) {
    if (!unit.open()) {
      plain++;
      continue;
    }
    Prompt text = prompt(unit);
    std::string found = state(unit, hashOf(text.system + text.user));
    if (found.empty()) continue;
    std::cout << "  " << found << ": " << unit.path << ".llmc" << std::endl;
    count++;
  }
  std::cout << "  без LLM: " << plain << ", без изменений: " << program.units.size() - plain - count;
  std::cout << ", к генерации LLM: " << count << std::endl;
  return count;
}

int Generator::translate() const {
  int count = 0;
  for (const Unit& unit : program.units) {
    std::string code = emitUnit(unit, program, ontology);
    writeFile(settings.output("ir", project) + "/units/" + unit.path + ".ir", irText(unit, ontology));
    writeFile(settings.output("ir", project) + "/draft/" + targetFile(unit), code);
    if (unit.open()) continue;
    writeFile(settings.output("code", project) + "/" + targetFile(unit), stripComments(code, ontology.comments()));
    count++;
  }
  return count;
}
