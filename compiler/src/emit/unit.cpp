#include "common/files.h"
#include "common/text.h"
#include "emit/emit.h"
#include "optimize/optimize.h"

std::string Emitter::header() const {
  std::set<std::string> used;
  std::string out;
  for (const Decl& decl : unit.decls) mentions(decl, used);
  for (const Import& item : unit.imports) {
    std::vector<std::string> names;
    for (const std::string& text : item.comments) out += comment("[пользователь] " + text);
    if (item.open) out += comment("[virtual] файл " + item.target + ": его создаёшь ты");
    else if (!item.target.empty()) out += comment("[файл] " + item.target + " создаётся по virtual import другого файла");
    else if (!item.file.empty()) out += comment("[файл] " + item.file + " лежит в проекте рядом с этим файлом");
    if (item.unit.empty()) continue;
    for (const Decl& decl : program.find(item.unit)->decls) {
      if (decl.exported && used.count(decl.name)) names.push_back(decl.name);
    }
    if (names.empty()) continue;
    out += fill(form("import"), {{"names", join(names, ", ")}, {"path", relativePath(unit.path, item.unit)}}) + "\n";
  }
  for (const std::string& line : imports) out += line + "\n";
  return out;
}

std::string Emitter::file() {
  std::string body;
  bool main = false;
  for (const Decl& decl : unit.decls) {
    body += "\n" + comments(decl) + declaration(decl);
    main = main || (decl.kind == "function" && decl.name == "main");
  }
  if (main && !outline) body += "\n" + form("main") + "\n";
  return trim(header() + body) + "\n";
}

std::string emitUnit(const Unit& unit, const Program& program, const Ontology& ontology, bool outline) {
  Emitter emitter{unit, program, ontology, outline, {}};
  return emitter.file();
}

std::string Emitter::declaration(const Decl& decl) {
  if (decl.typeLike()) return typeLike(decl) + "\n";
  if (decl.kind == "function") return function(decl) + "\n";
  std::string kind = decl.is("const") ? ontology.emit("const") : form("let");
  return fill(form("variable"), {{"export", decl.exported ? ontology.emit("export") + " " : ""}, {"const", kind},
                                 {"name", decl.name}, {"type", type(decl.type)}, {"value", value(decl)}}) + "\n";
}
