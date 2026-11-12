#include <algorithm>
#include <cctype>
#include <sstream>
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"
#include "lexer/lexer.h"

namespace {

void addRule(Dictionary& dictionary, std::istringstream& stream, bool skip, const std::string& path, int number) {
  std::string name, pattern;
  stream >> name;
  std::getline(stream, pattern);
  try {
    dictionary.rules.push_back({name, std::regex(trim(pattern)), skip});
  } catch (const std::regex_error&) {
    throw fail(path, number, "неверный шаблон токена " + name);
  }
}

void addWords(Dictionary& dictionary, std::istringstream& stream, const std::string& section) {
  std::string word;
  while (stream >> word) {
    bool name = std::isalpha((unsigned char)word[0]) || word[0] == '_';
    if (section == "%keyword") dictionary.keywords.insert(word);
    if (section == "%operator") dictionary.operators.insert(word);
    if (!name) dictionary.symbols.push_back(word);
  }
}

}  // namespace

Dictionary loadDictionary(const std::string& path) {
  Dictionary dictionary;
  std::string section;
  int number = 0;
  for (const std::string& text : split(readFile(path), '\n')) {
    number++;
    std::string line = trim(text);
    if (line.empty()) continue;
    std::istringstream stream(line);
    if (startsWith(line, "%")) {
      section = line;
    } else if (section == "%skip" || section == "%token") {
      addRule(dictionary, stream, section == "%skip", path, number);
    } else if (section == "%keyword" || section == "%operator" || section == "%punct") {
      addWords(dictionary, stream, section);
    } else {
      throw fail(path, number, "неизвестный раздел " + section);
    }
  }
  std::stable_sort(dictionary.symbols.begin(), dictionary.symbols.end(),
                   [](const std::string& a, const std::string& b) { return a.size() > b.size(); });
  return dictionary;
}
