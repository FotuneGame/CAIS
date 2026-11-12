#include <cctype>
#include "common/text.h"

std::string fill(const std::string& form, const std::map<std::string, std::string>& values) {
  std::string out;
  for (size_t i = 0; i < form.size(); i++) {
    size_t close = form[i] == '{' ? form.find('}', i) : std::string::npos;
    auto found = close == std::string::npos ? values.end() : values.find(form.substr(i + 1, close - i - 1));
    if (found == values.end()) {
      out += form[i];
      continue;
    }
    out += found->second;
    i = close;
  }
  return out;
}

std::string indent(const std::string& text) {
  std::string out;
  for (const std::string& line : split(text, '\n')) out += (line.empty() ? "" : "  " + line) + "\n";
  return out;
}

std::string squeeze(const std::string& text) {
  std::string out;
  for (unsigned char c : text) {
    if (!std::isspace(c)) out += (char)c;
  }
  return out;
}

std::string lower(const std::string& text) {
  std::string out = text;
  for (size_t i = 0; i < out.size(); i++) {
    unsigned char lead = out[i];
    unsigned char next = i + 1 < out.size() ? out[i + 1] : 0;
    if (lead < 0x80) {
      out[i] = (char)std::tolower(lead);
    } else if (lead == 0xD0 && next >= 0x90 && next <= 0x9F) {
      out[++i] = (char)(next + 0x20);
    } else if (lead == 0xD0 && next >= 0xA0 && next <= 0xAF) {
      out[i] = (char)0xD1;
      out[++i] = (char)(next - 0x20);
    }
  }
  return out;
}
