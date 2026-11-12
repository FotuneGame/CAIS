#include "codegen/generate.h"
#include "common/files.h"
#include "common/text.h"
#include "emit/emit.h"
#include "ir/annotate.h"

std::string Generator::targetFile(const Unit& unit) const {
  return unit.path + "." + ontology.extension();
}

std::vector<std::string> Generator::scope(const Unit& unit) const {
  std::vector<std::string> found = {"base"};
  std::string plain;
  auto add = [&](const Decl& decl) { plain += lower(decl.name + " " + join(decl.comments, " ") + " "); };
  for (const Import& item : unit.imports) plain += lower(item.name + " " + join(item.comments, " ") + " ");
  for (const Decl& decl : unit.decls) {
    add(decl);
    for (const Decl& member : decl.members) add(member);
    for (const std::string& base : decl.bases) {
      auto symbol = unit.symbols.find(root(base));
      if (symbol != unit.symbols.end()) add(*symbol->second);
    }
  }
  for (const auto& part : ontology.parts) {
    bool used = false;
    for (const std::string& word : part.second.list("mentions")) used = used || plain.find(word) != std::string::npos;
    if (used && part.first != "base") found.push_back(part.first);
  }
  return found;
}

Prompt Generator::prompt(const Unit& unit) const {
  std::vector<std::string> parts = scope(unit);
  std::vector<std::string> created = unit.created();
  Prompt result;
  result.system = "Ты — генератор кода компилятора LLMC: переводишь файл языка LLMC в язык " + ontology.target + ".\nПравила:\n";
  for (const std::string& part : parts) {
    for (const std::string& rule : ontology.parts.at(part).list("rules")) result.system += "- " + rule + "\n";
  }
  std::string readme = project.dir + "/README.md";
  if (exists(readme)) result.user = "## Описание проекта (README.md)\n" + readFile(readme).substr(0, 6000) + "\n\n";
  result.user += "## IR\n" + irText(unit, ontology) + "\n## Объявления импортированных файлов\n";
  for (const Import& item : unit.imports) {
    if (item.unit.empty()) continue;
    const Unit& other = *program.find(item.unit);
    result.user += "// файл " + targetFile(other) + "\n" + emitUnit(other, program, ontology, true) + "\n";
  }
  result.user += "## Пакеты\n";
  for (const std::string& part : parts) {
    for (const auto& package : ontology.parts.at(part).at("packages").fields) {
      result.user += "- " + package.first + " — " + package.second.str("about") + "\n";
    }
  }
  result.user += "\n## Файл " + targetFile(unit) + "\n" + emitUnit(unit, program, ontology);
  if (created.empty()) return result;
  result.user += "\n## Файлы virtual import\nСоздай целиком: " + join(created, ", ") + ".\n";
  result.user += "Ответ — несколько файлов подряд; перед каждым строка «=== путь от корня проекта». Первый файл — " + targetFile(unit) + ".\n";
  return result;
}

std::vector<Part> Generator::answer(const Unit& unit, const std::string& text) const {
  std::string code = cleanCode(text);
  if (unit.created().empty()) return {{targetFile(unit), code}};
  std::vector<Part> found;
  for (const std::string& line : split(code, '\n')) {
    if (startsWith(line, "=== ")) found.push_back({trim(replaceAll(line.substr(4), "\\", "/")), ""});
    else if (!found.empty() && !startsWith(line, "```")) found.back().code += line + "\n";
  }
  return found;
}

std::string cleanCode(const std::string& answer) {
  std::string code = answer;
  size_t think = code.find("</think>");
  if (think != std::string::npos) code = code.substr(think + 8);
  code = trim(code);
  if (startsWith(code, "```")) {
    size_t line = code.find('\n');
    code = line == std::string::npos ? "" : code.substr(line + 1);
  }
  if (endsWith(code, "```")) code = code.substr(0, code.size() - 3);
  return trim(code) + "\n";
}
