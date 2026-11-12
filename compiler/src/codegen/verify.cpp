#include <algorithm>
#include <filesystem>
#include <regex>
#include <set>
#include "codegen/generate.h"
#include "common/error.h"
#include "common/text.h"
#include "emit/emit.h"

namespace fs = std::filesystem;

namespace {

bool matches(const std::string& code, const std::string& pattern) {
  try {
    return std::regex_search(code, std::regex(pattern));
  } catch (const std::regex_error&) {
    throw fail("онтология: неверное регулярное выражение " + pattern);
  }
}

}  // namespace

void Generator::declared(const Decl& decl, const std::string& code, const Unit& unit, std::vector<std::string>& found) const {
  auto expect = [&](const Json* entry, const std::string& what) {
    std::string pattern = entry ? replaceAll(entry->str("verify"), "{name}", decl.name) : "";
    if (!pattern.empty() && !matches(code, pattern)) found.push_back(what + ": " + entry->str("about"));
  };
  bool test = unit.test() && decl.kind == "function" && decl.params.empty() && !decl.exported && decl.type == "bool";
  bool free = decl.open() && decl.typeLike() && decl.members.empty();
  if (decl.kind != "constructor" && !test && !matches(code, "\\b" + decl.name + "\\b")) found.push_back("в коде нет имени " + decl.name);
  if (!free) expect(ontology.word(decl.kind), "нет объявления " + decl.kind + " " + decl.name);
  if (decl.exported) expect(ontology.word("export"), "объявление " + decl.name + " не экспортировано");
  if (decl.code() && decl.hasBody && !decl.open()) {
    Emitter emitter{unit, program, ontology, false, {}};
    std::string body = squeeze(stripComments(emitter.body(decl), ontology.comments()));
    if (squeeze(code).find(body) == std::string::npos) {
      found.push_back("тело " + (decl.name.empty() ? "конструктора" : decl.name) + " написано человеком и изменено: верни его символ в символ");
    }
  }
  for (const Decl& member : decl.members) declared(member, code, unit, found);
}

void Generator::imported(const Part& part, const std::vector<Part>& parts, const Unit& unit, std::vector<std::string>& found) const {
  std::regex pattern(ontology.word("import")->str("verify"));
  std::set<std::string> files = {unit.path};
  std::vector<std::string> allowed = scope(unit);
  for (const Import& item : unit.imports) files.insert(item.unit.empty() ? item.target.substr(0, item.target.rfind('.')) : item.unit);
  for (const Part& other : parts) files.insert(other.path.substr(0, other.path.rfind('.')));
  for (std::sregex_iterator item(part.code.begin(), part.code.end(), pattern), end; item != end; ++item) {
    std::string name = (*item)[1];
    if (startsWith(name, ".")) {
      std::string path = (fs::path(part.path).parent_path() / name).lexically_normal().generic_string();
      if (!files.count(path)) found.push_back(part.path + ": импорт файла " + name + ", которого нет в import исходного файла");
      continue;
    }
    bool known = false;
    for (const std::string& scope : allowed) {
      for (const auto& package : ontology.parts.at(scope).at("packages").fields) {
        known = known || name == package.first || startsWith(name, package.first + "/") || startsWith(name, package.first + ":");
      }
    }
    if (!known) found.push_back(part.path + ": пакета " + name + " нет в packages онтологий файла");
  }
}

void Generator::extra(const std::vector<Part>& parts, const Unit& unit, std::vector<std::string>& found) const {
  std::vector<std::string> created = unit.created();
  for (const std::string& file : created) {
    bool made = false;
    for (const Part& part : parts) made = made || part.path == file;
    if (!made) found.push_back("нет файла " + file + " из virtual import");
  }
  for (size_t i = 1; i < parts.size(); i++) {
    bool asked = std::find(created.begin(), created.end(), parts[i].path) != created.end();
    if (!asked) found.push_back("файла " + parts[i].path + " нет среди virtual import");
  }
}

std::vector<std::string> Generator::problems(const std::vector<Part>& parts, const Unit& unit) const {
  std::vector<std::string> found;
  if (parts.empty() || parts[0].path != targetFile(unit)) return {"первым должен идти файл " + targetFile(unit)};
  for (const Part& part : parts) {
    if (trim(part.code).empty()) found.push_back(part.path + ": пустой файл");
    if (part.code.find(ontology.form("virtual")) != std::string::npos) found.push_back(part.path + ": остался " + ontology.form("virtual"));
    imported(part, parts, unit, found);
  }
  extra(parts, unit, found);
  for (const Decl& decl : unit.decls) declared(decl, parts[0].code, unit, found);
  return found;
}
