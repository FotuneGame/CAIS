#include <filesystem>
#include <set>
#include "common/text.h"
#include "ir/checker.h"

namespace fs = std::filesystem;

std::string bare(const std::string& type) {
  return endsWith(type, "?") ? type.substr(0, type.size() - 1) : type;
}

std::string element(const std::string& type) {
  std::string base = bare(type);
  if (endsWith(base, "[]")) return base.substr(0, base.size() - 2);
  return "any";
}

std::string unwrap(const std::string& type) {
  std::string base = bare(type);
  return startsWith(base, "promise<") ? base.substr(8, base.size() - 9) : base;
}

bool integer(const std::string& type) {
  std::vector<std::string> parts = words(type);
  if (parts.empty() || type.find_first_of("<[") != std::string::npos) return false;
  for (const std::string& part : parts) {
    bool known = part == "char" || part == "short" || part == "int" || part == "long" || part == "signed";
    if (!known && part != "unsigned") return false;
  }
  return true;
}

bool floating(const std::string& type) {
  return type == "float" || type == "double" || type == "long double";
}

bool numeric(const std::string& type) {
  return type == "any" || integer(type) || floating(type);
}

void resolve(Program& program, const std::string& extension) {
  std::set<std::string> created;
  auto place = [](const Unit& unit, const Import& item) {
    std::string name = endsWith(item.name, ".llmc") ? item.name.substr(0, item.name.size() - 5) : item.name;
    return (fs::path(unit.path).parent_path() / name).lexically_normal().generic_string();
  };
  for (Unit& unit : program.units) {
    for (Import& item : unit.imports) {
      if (!item.open) continue;
      item.target = place(unit, item) + "." + extension;
      if (program.find(place(unit, item))) throw fail(unit.file, item.line, "virtual import: файл " + item.name + " уже написан на LLMC");
      if (!created.insert(item.target).second) throw fail(unit.file, item.line, item.target + " уже создаёт другой virtual import");
    }
  }
  for (Unit& unit : program.units) {
    for (Import& item : unit.imports) {
      std::string path = place(unit, item);
      if (item.open) continue;
      if (program.find(path)) item.unit = path;
      else if (created.count(path + "." + extension)) item.target = path + "." + extension;
      else if (fs::is_regular_file(fs::path(unit.file).parent_path() / item.name)) item.file = item.name;
      else throw fail(unit.file, item.line, "нет файла " + item.name);
    }
  }
  bind(program);
}

void bind(Program& program) {
  for (Unit& unit : program.units) {
    unit.symbols.clear();
    for (const Decl& decl : unit.decls) {
      if (!unit.symbols.emplace(decl.name, &decl).second) throw fail(unit.file, decl.line, "повторное имя " + decl.name);
    }
  }
  for (Unit& unit : program.units) {
    for (const Import& item : unit.imports) {
      if (item.unit.empty()) continue;
      for (const Decl& decl : program.find(item.unit)->decls) {
        if (decl.exported) unit.symbols.emplace(decl.name, &decl);
      }
    }
  }
}
