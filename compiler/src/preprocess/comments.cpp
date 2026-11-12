#include "common/files.h"
#include "common/text.h"
#include "preprocess/preprocess.h"

namespace {

struct Reader {
  std::string file;
  std::vector<Line> lines;
  std::string code;
  std::string note;
  int number = 1;

  bool blank() const { return trim(code).empty(); }

  void flushCode() {
    if (!blank()) lines.push_back({trim(code), file, number});
    code.clear();
  }

  void flushNote() {
    std::string text = trim(note);
    while (startsWith(text, "*")) text = trim(text.substr(1));
    if (!text.empty()) lines.push_back({"// " + text, file, number});
    note.clear();
  }
};

}  // namespace

std::vector<Line> readLines(const std::string& file) {
  std::string text = readFile(file);
  Reader reader{file, {}, "", "", 1};
  bool block = false;
  char quote = '\0';
  for (size_t i = 0; i < text.size(); i++) {
    char c = text[i];
    char next = i + 1 < text.size() ? text[i + 1] : '\0';
    if (block) {
      if (c == '*' && next == '/') {
        reader.flushNote();
        block = false;
        i++;
      } else if (c == '\n') {
        reader.flushNote();
        reader.number++;
      } else {
        reader.note += c;
      }
    } else if (c == '\n') {
      reader.flushCode();
      reader.number++;
      quote = '\0';
    } else if (quote) {
      reader.code += c;
      if (c == '\\' && next != '\n' && next != '\0') reader.code += text[++i];
      else if (c == quote) quote = '\0';
    } else if (c == '/' && (next == '*' || next == '/')) {
      reader.flushCode();
      block = next == '*';
      i++;
      if (block) continue;
      size_t end = text.find('\n', i);
      reader.note = text.substr(i + 1, end == std::string::npos ? end : end - i - 1);
      reader.flushNote();
      i = (end == std::string::npos ? text.size() : end) - 1;
    } else if (c == ' ' || c == '\t' || c == '\r') {
      if (!reader.code.empty() && reader.code.back() != ' ') reader.code += ' ';
    } else {
      reader.code += c;
      if (c == '"' || c == '\'') quote = c;
    }
  }
  reader.flushCode();
  return reader.lines;
}
