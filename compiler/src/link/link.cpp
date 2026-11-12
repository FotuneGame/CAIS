#include "link/link.h"
#include <algorithm>
#include <filesystem>
#include <regex>
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"

namespace fs = std::filesystem;

void Linker::require(const std::string& name, std::set<std::string>& used) const {
  for (const auto& part : ontology.parts) {
    for (const auto& item : part.second.at("packages").fields) {
      bool same = name == item.first || startsWith(name, item.first + "/");
      if (!same || !used.insert(item.first).second) continue;
      for (const std::string& other : item.second.list("requires")) require(other, used);
    }
  }
}

std::string Linker::manifest(const std::vector<std::string>& generated) const {
  Json scripts, packages, result;
  std::set<std::string> used;
  std::regex pattern(ontology.word("import")->str("verify"));
  scripts.kind = packages.kind = Json::Object;
  for (const std::string& file : generated) {
    std::string code = readFile(settings.output("code", project) + "/" + file);
    for (std::sregex_iterator item(code.begin(), code.end(), pattern), end; item != end; ++item) require((*item)[1], used);
  }
  for (const auto& part : ontology.parts) {
    for (const auto& item : part.second.at("scripts").fields) scripts.set(item.first, item.second);
    for (const auto& item : part.second.at("packages").fields) {
      std::string path = item.second.str("path");
      std::string place = item.second.str("version", path.empty() ? item.second.str("url") : "file:" + path);
      if (item.second.flag("builtin") || !(used.count(item.first) || item.second.flag("always"))) continue;
      if (place.empty()) throw fail("онтология " + part.first + ": у пакета " + item.first + " нет version, url или path");
      packages.set(item.first, Json::of(place));
    }
  }
  if (!scripts.has("build")) throw fail("в онтологиях нет скрипта build");
  result.set("name", Json::of(project.name));
  result.set("version", Json::of("1.0.0"));
  result.set("private", Json::raw(Json::Bool, "true"));
  result.set("scripts", scripts);
  result.set("dependencies", packages);
  return dumpJson(result) + "\n";
}

void Linker::prepare(const std::vector<std::string>& generated) {
  std::string code = settings.output("code", project);
  std::vector<std::string> kept = generated;
  for (const std::string& file : generated) tests = tests || file.find(".test.") != std::string::npos;
  for (const SourceFile& file : project.files) {
    if (endsWith(file.path, ".llmc")) continue;
    fs::path target = fs::path(code) / file.path;
    fs::create_directories(target.parent_path());
    fs::copy_file(file.from, target, fs::copy_options::overwrite_existing);
    kept.push_back(file.path);
  }
  std::string listFile = settings.output("ir", project) + "/files.txt";
  std::vector<std::string> before = exists(listFile) ? split(readFile(listFile), '\n') : std::vector<std::string>();
  for (const std::string& file : before) {
    if (std::find(kept.begin(), kept.end(), file) == kept.end()) fs::remove(code + "/" + file);
  }
  writeFile(listFile, join(kept, "\n") + "\n");
  std::string file = code + "/" + settings.profile().str("manifest");
  std::string text = manifest(generated);
  if (!exists(file) || readFile(file) != text) writeFile(file, text);
  std::string output;
  std::string install = settings.profile().str("install");
  if (run(inDir(code, install), output) != 0) throw fail("пакеты из онтологий не установились (" + install + "):\n" + output);
}

int Linker::script(const std::string& name, std::string& output) const {
  std::string command = replaceAll(settings.profile().str("script"), "{name}", name);
  return run(inDir(settings.output("code", project), command), output);
}

std::string Linker::build() const {
  std::string output;
  int code = script("build", output);
  if (code == 0 && tests) code = script("test", output);
  if (code == 0) return "";
  return output.empty() ? "сборка завершилась с кодом " + std::to_string(code) : output;
}

void Linker::publish() const {
  std::string bin = settings.output("bin", project);
  std::string built = settings.output("code", project) + "/" + settings.profile().str("output");
  if (!exists(built)) throw fail("нет результата сборки " + built);
  fs::remove_all(bin);
  copyTree(built, bin, {});
}
