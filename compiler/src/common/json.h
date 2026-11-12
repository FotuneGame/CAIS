#pragma once
#include <string>
#include <utility>
#include <vector>

struct Json {
  enum Kind { Null, Bool, Number, String, Array, Object };
  Kind kind = Null;
  std::string text;
  std::vector<Json> items;
  std::vector<std::pair<std::string, Json>> fields;

  static Json of(const std::string& value);
  static Json raw(Kind kind, const std::string& text);
  bool has(const std::string& key) const;
  const Json& at(const std::string& key) const;
  Json& set(const std::string& key, Json value);
  std::string str(const std::string& key, const std::string& fallback = "") const;
  int number(const std::string& key, int fallback) const;
  bool flag(const std::string& key) const;
  std::vector<std::string> list(const std::string& key) const;
};

Json parseJson(const std::string& text, const std::string& name);
std::string dumpJson(const Json& value, int depth = 0);
std::string quote(const std::string& text);
std::string utf8(unsigned code);
