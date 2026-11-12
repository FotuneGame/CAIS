#include "common/text.h"
#include <cctype>
#include <cstdio>
#include <sstream>

std::vector<std::string> split(const std::string& text, char separator) {
  std::vector<std::string> parts;
  std::string part;
  std::istringstream stream(text);
  while (std::getline(stream, part, separator)) parts.push_back(part);
  return parts;
}

std::string join(const std::vector<std::string>& parts, const std::string& separator) {
  std::string text;
  for (size_t i = 0; i < parts.size(); i++) text += (i ? separator : "") + parts[i];
  return text;
}

std::string trim(const std::string& text) {
  const char* space = " \t\r\n";
  size_t from = text.find_first_not_of(space);
  if (from == std::string::npos) return "";
  return text.substr(from, text.find_last_not_of(space) - from + 1);
}

std::string replaceAll(std::string text, const std::string& from, const std::string& to) {
  for (size_t at = text.find(from); at != std::string::npos; at = text.find(from, at + to.size())) {
    text.replace(at, from.size(), to);
  }
  return text;
}

bool startsWith(const std::string& text, const std::string& prefix) {
  return text.compare(0, prefix.size(), prefix) == 0;
}

bool endsWith(const std::string& text, const std::string& suffix) {
  return text.size() >= suffix.size() && text.compare(text.size() - suffix.size(), suffix.size(), suffix) == 0;
}

std::string kebab(const std::string& name) {
  std::string text;
  for (size_t i = 0; i < name.size(); i++) {
    unsigned char c = name[i];
    if (std::isupper(c) && i > 0 && !std::isupper((unsigned char)name[i - 1])) text += '-';
    text += (char)std::tolower(c);
  }
  return text;
}

std::string pascal(const std::string& name) {
  std::string text = name;
  if (!text.empty()) text[0] = (char)std::toupper((unsigned char)text[0]);
  return text;
}

std::vector<std::string> words(const std::string& text) {
  std::vector<std::string> found;
  std::string word;
  for (unsigned char c : text + " ") {
    bool letter = std::isalpha(c) || c == '_' || (!word.empty() && std::isdigit(c));
    if (letter) {
      word += (char)c;
    } else if (!word.empty()) {
      found.push_back(word);
      word.clear();
    }
  }
  return found;
}

std::string hashOf(const std::string& text) {
  unsigned long long hash = 1469598103934665603ULL;
  for (unsigned char c : text) hash = (hash ^ c) * 1099511628211ULL;
  char buffer[17];
  std::snprintf(buffer, sizeof buffer, "%016llx", hash);
  return buffer;
}
