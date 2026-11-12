#include "settings/settings.h"
#include <algorithm>
#include <filesystem>
#include <regex>
#include <set>
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"

namespace fs = std::filesystem;

namespace {

const std::set<std::string> SKIPPED = {"node_modules", "dist", "build", ".git"};

}  // namespace

Settings loadSettings(const std::string& path, const std::string& target) {
  Settings settings;
  settings.json = parseJson(readFile(path), path);
  settings.dir = fs::path(path).parent_path().generic_string();
  settings.language = target;
  if (!settings.json.at("targets").has(target)) {
    throw fail(path + ": в targets нет настроек целевого языка " + target);
  }
  if (!exists(settings.file("ontologies") + "/" + target + "/base.json")) {
    throw fail("нет онтологии целевого языка: " + settings.file("ontologies") + "/" + target + "/base.json");
  }
  return settings;
}

Project loadProject(const std::string& dir) {
  Project project;
  fs::path root = fs::absolute(fs::path(dir) / "").parent_path().lexically_normal();
  project.dir = root.generic_string();
  project.name = root.filename().string();
  if (!fs::exists(root)) throw fail("нет каталога " + project.dir);
  std::regex name("^([a-z0-9]+\\.[a-z]+|main)\\.llmc$");
  for (auto entry = fs::recursive_directory_iterator(root); entry != fs::recursive_directory_iterator(); ++entry) {
    std::string file = entry->path().filename().string();
    if (SKIPPED.count(file)) {
      if (entry->is_directory()) entry.disable_recursion_pending();
      continue;
    }
    if (!entry->is_regular_file()) continue;
    std::string path = entry->path().lexically_relative(root).generic_string();
    if (endsWith(file, ".llmc") && !std::regex_match(file, name)) {
      throw fail(path + ": имя файла должно быть вида <имя>.<тип>.llmc, например notes.service.llmc");
    }
    project.files.push_back({entry->path().generic_string(), path});
  }
  auto byPath = [](const SourceFile& a, const SourceFile& b) { return a.path < b.path; };
  std::sort(project.files.begin(), project.files.end(), byPath);
  return project;
}
