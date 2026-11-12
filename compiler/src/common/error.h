#pragma once
#include <stdexcept>
#include <string>

struct Error : std::runtime_error {
  using std::runtime_error::runtime_error;
};

inline Error fail(const std::string& message) {
  return Error(message);
}

inline Error fail(const std::string& file, int line, const std::string& message) {
  return Error(file + ":" + std::to_string(line) + ": " + message);
}
