#include "common/json.h"
#include <cstdlib>

Json Json::of(const std::string& value) {
  return raw(String, value);
}

Json Json::raw(Kind kind, const std::string& text) {
  Json json;
  json.kind = kind;
  json.text = text;
  return json;
}

bool Json::has(const std::string& key) const {
  for (const auto& field : fields) {
    if (field.first == key) return true;
  }
  return false;
}

const Json& Json::at(const std::string& key) const {
  static const Json none;
  for (const auto& field : fields) {
    if (field.first == key) return field.second;
  }
  return none;
}

Json& Json::set(const std::string& key, Json value) {
  kind = Object;
  for (auto& field : fields) {
    if (field.first != key) continue;
    field.second = std::move(value);
    return field.second;
  }
  fields.emplace_back(key, std::move(value));
  return fields.back().second;
}

std::string Json::str(const std::string& key, const std::string& fallback) const {
  const Json& value = at(key);
  return value.kind == Null ? fallback : value.text;
}

int Json::number(const std::string& key, int fallback) const {
  const Json& value = at(key);
  return value.kind == Number ? std::atoi(value.text.c_str()) : fallback;
}

bool Json::flag(const std::string& key) const {
  return at(key).text == "true";
}

std::vector<std::string> Json::list(const std::string& key) const {
  std::vector<std::string> values;
  for (const Json& item : at(key).items) values.push_back(item.text);
  return values;
}
