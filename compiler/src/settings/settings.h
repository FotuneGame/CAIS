#pragma once
#include <string>
#include <vector>
#include "common/json.h"

struct SourceFile {
  std::string from;
  std::string path;
};

struct Project {
  std::string dir;
  std::string name;
  std::vector<SourceFile> files;
};

struct Settings {
  Json json;
  std::string dir;
  std::string language;

  std::string target() const { return language; }
  const Json& profile() const { return json.at("targets").at(language); }
  std::string file(const std::string& key) const { return dir + "/" + json.str(key); }
  std::string output(const std::string& key, const Project& project) const {
    return json.at("output").str(key) + "/" + project.name;
  }
};

Settings loadSettings(const std::string& path, const std::string& target);
Project loadProject(const std::string& dir);
