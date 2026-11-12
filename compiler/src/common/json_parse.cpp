#include <cctype>
#include <cstring>
#include "common/error.h"
#include "common/json.h"

namespace {

struct Reader {
  const std::string& text;
  const std::string& name;
  size_t pos = 0;

  Error bad(const std::string& what) const {
    return fail(name + ": JSON, позиция " + std::to_string(pos) + ": " + what);
  }

  char peek() {
    while (pos < text.size() && std::isspace((unsigned char)text[pos])) pos++;
    return pos < text.size() ? text[pos] : '\0';
  }

  void expect(char c) {
    if (peek() != c) throw bad(std::string("ожидался символ ") + c);
    pos++;
  }

  unsigned hex() {
    if (pos + 4 > text.size()) throw bad("обрыв \\u");
    pos += 4;
    return (unsigned)std::stoul(text.substr(pos - 4, 4), nullptr, 16);
  }

  std::string escape() {
    char c = text[pos++];
    const char* from = "nrtbf";
    const char* to = "\n\r\t\b\f";
    if (const char* found = c ? std::strchr(from, c) : nullptr) return std::string(1, to[found - from]);
    if (c != 'u') return std::string(1, c);
    unsigned code = hex();
    if (code >= 0xD800 && code < 0xDC00 && text.compare(pos, 2, "\\u") == 0) {
      pos += 2;
      code = 0x10000 + ((code - 0xD800) << 10) + (hex() - 0xDC00);
    }
    return utf8(code);
  }

  std::string string() {
    expect('"');
    std::string out;
    while (pos < text.size() && text[pos] != '"') {
      bool escaped = text[pos] == '\\' && pos + 1 < text.size();
      if (escaped) pos++;
      out += escaped ? escape() : std::string(1, text[pos++]);
    }
    if (pos >= text.size()) throw bad("незакрытая строка");
    pos++;
    return out;
  }

  Json composite(char open) {
    Json json;
    char close = open == '{' ? '}' : ']';
    json.kind = open == '{' ? Json::Object : Json::Array;
    pos++;
    while (peek() != close) {
      if (open == '{') {
        std::string key = string();
        expect(':');
        json.fields.emplace_back(key, value());
      } else {
        json.items.push_back(value());
      }
      if (peek() == ',') pos++;
      else if (peek() != close) throw bad("ожидалась запятая");
    }
    pos++;
    return json;
  }

  Json value() {
    char c = peek();
    if (c == '"') return Json::of(string());
    if (c == '{' || c == '[') return composite(c);
    size_t from = pos;
    while (pos < text.size() && (std::isalnum((unsigned char)text[pos]) || std::strchr("+-.", text[pos]))) pos++;
    std::string word = text.substr(from, pos - from);
    if (word.empty()) throw bad("неожиданный символ");
    if (word == "null") return Json();
    return Json::raw(word == "true" || word == "false" ? Json::Bool : Json::Number, word);
  }
};

}  // namespace

Json parseJson(const std::string& text, const std::string& name) {
  Reader reader{text, name};
  Json json = reader.value();
  if (reader.peek() != '\0') throw reader.bad("лишний текст после значения");
  return json;
}
