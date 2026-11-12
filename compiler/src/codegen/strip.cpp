#include "codegen/generate.h"
#include "common/text.h"

namespace {

std::string tidy(const std::string& code) {
  std::string out;
  bool blank = true;
  for (const std::string& line : split(code, '\n')) {
    size_t end = line.find_last_not_of(" \t");
    if (end == std::string::npos && blank) continue;
    blank = end == std::string::npos;
    out += (blank ? "" : line.substr(0, end + 1)) + "\n";
  }
  return trim(out) + "\n";
}

}  // namespace

std::string stripComments(const std::string& code, const Json& rules) {
  std::string line = rules.str("line"), open = rules.str("open"), close = rules.str("close"), quotes = rules.str("quotes");
  std::string out;
  char quote = 0;
  for (size_t i = 0; i < code.size(); i++) {
    char c = code[i];
    if (quote) {
      out += c;
      if (c == '\\' && i + 1 < code.size()) out += code[++i];
      else if (c == quote) quote = 0;
    } else if (quotes.find(c) != std::string::npos) {
      quote = c;
      out += c;
    } else if (!line.empty() && code.compare(i, line.size(), line) == 0) {
      size_t start = out.find_last_not_of(" \t");
      bool whole = start == std::string::npos || out[start] == '\n';
      i = code.find('\n', i);
      if (i == std::string::npos) break;
      if (whole) out.erase(start == std::string::npos ? 0 : start + 1);
      else out += '\n';
    } else if (!open.empty() && code.compare(i, open.size(), open) == 0) {
      size_t end = code.find(close, i + open.size());
      if (end == std::string::npos) break;
      i = end + close.size() - 1;
    } else {
      out += c;
    }
  }
  return tidy(out);
}
