#include "common/files.h"
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <sstream>
#include "common/error.h"
#include "common/text.h"

namespace fs = std::filesystem;

std::string readFile(const std::string& path) {
  std::ifstream file(path, std::ios::binary);
  if (!file) throw fail("нет файла " + path);
  std::stringstream buffer;
  buffer << file.rdbuf();
  return replaceAll(buffer.str(), "\r", "");
}

void writeFile(const std::string& path, const std::string& text) {
  fs::create_directories(fs::path(path).parent_path());
  std::ofstream file(path, std::ios::binary);
  if (!file) throw fail("не удалось записать " + path);
  file << text;
}

bool exists(const std::string& path) {
  return fs::exists(path);
}

std::vector<std::string> listFiles(const std::string& dir) {
  std::vector<std::string> files;
  if (!fs::exists(dir)) return files;
  for (const auto& entry : fs::recursive_directory_iterator(dir)) {
    if (entry.is_regular_file()) files.push_back(fs::relative(entry.path(), dir).generic_string());
  }
  return files;
}

void copyTree(const std::string& from, const std::string& to, const std::set<std::string>& skip) {
  fs::create_directories(to);
  auto options = fs::copy_options::recursive | fs::copy_options::overwrite_existing;
  for (const auto& entry : fs::directory_iterator(from)) {
    std::string name = entry.path().filename().string();
    if (!skip.count(name)) fs::copy(entry.path(), fs::path(to) / name, options);
  }
}

std::string relativePath(const std::string& fromFile, const std::string& toFile) {
  std::string path = fs::path(toFile).lexically_relative(fs::path(fromFile).parent_path()).generic_string();
  return startsWith(path, ".") ? path : "./" + path;
}

std::string inDir(const std::string& dir, const std::string& command) {
#ifdef _WIN32
  return "cd /d \"" + fs::path(dir).make_preferred().string() + "\" && " + command;
#else
  return "cd \"" + dir + "\" && " + command;
#endif
}

int run(const std::string& command, std::string& output) {
  output.clear();
#ifdef _WIN32
  FILE* pipe = _popen((command + " 2>&1").c_str(), "r");
#else
  FILE* pipe = popen((command + " 2>&1").c_str(), "r");
#endif
  if (!pipe) throw fail("не удалось выполнить: " + command);
  char buffer[4096];
  while (size_t size = std::fread(buffer, 1, sizeof buffer, pipe)) output.append(buffer, size);
#ifdef _WIN32
  return _pclose(pipe);
#else
  int status = pclose(pipe);
  return status == -1 ? -1 : (status >> 8) & 0xff;
#endif
}
