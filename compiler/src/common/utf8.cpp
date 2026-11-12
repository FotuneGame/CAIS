#include "common/json.h"

std::string utf8(unsigned code) {
  std::string out;
  if (code < 0x80) {
    out += (char)code;
  } else if (code < 0x800) {
    out += (char)(0xC0 | (code >> 6));
    out += (char)(0x80 | (code & 0x3F));
  } else if (code < 0x10000) {
    out += (char)(0xE0 | (code >> 12));
    out += (char)(0x80 | ((code >> 6) & 0x3F));
    out += (char)(0x80 | (code & 0x3F));
  } else {
    out += (char)(0xF0 | (code >> 18));
    out += (char)(0x80 | ((code >> 12) & 0x3F));
    out += (char)(0x80 | ((code >> 6) & 0x3F));
    out += (char)(0x80 | (code & 0x3F));
  }
  return out;
}
