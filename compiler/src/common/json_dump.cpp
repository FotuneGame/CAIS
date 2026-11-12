#include <cstdio>
#include "common/json.h"

std::string quote(const std::string& text) {
  std::string out = "\"";
  for (unsigned char c : text) {
    if (c == '"') out += "\\\"";
    else if (c == '\\') out += "\\\\";
    else if (c == '\n') out += "\\n";
    else if (c == '\r') out += "\\r";
    else if (c == '\t') out += "\\t";
    else if (c < 0x20) {
      char buffer[8];
      std::snprintf(buffer, sizeof buffer, "\\u%04x", (unsigned)c);
      out += buffer;
    } else {
      out += (char)c;
    }
  }
  return out + "\"";
}

std::string dumpJson(const Json& value, int depth) {
  if (value.kind == Json::Null) return "null";
  if (value.kind == Json::String) return quote(value.text);
  if (value.kind != Json::Array && value.kind != Json::Object) return value.text;
  bool object = value.kind == Json::Object;
  size_t size = object ? value.fields.size() : value.items.size();
  if (size == 0) return object ? "{}" : "[]";
  std::string pad(depth * 2 + 2, ' ');
  std::string out = object ? "{\n" : "[\n";
  for (size_t i = 0; i < size; i++) {
    out += pad;
    if (object) out += quote(value.fields[i].first) + ": ";
    out += dumpJson(object ? value.fields[i].second : value.items[i], depth + 1);
    out += i + 1 < size ? ",\n" : "\n";
  }
  return out + std::string(depth * 2, ' ') + (object ? "}" : "]");
}
