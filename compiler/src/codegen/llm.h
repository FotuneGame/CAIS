#pragma once
#include <string>

struct Llm {
  static constexpr int PARALLEL = 4;
  static constexpr int ATTEMPTS = 3;
  static constexpr int TIMEOUT = 600;

  std::string model;

  Llm();
  std::string ask(const std::string& system, const std::string& user);

 private:
  std::string url;
  std::string token;

  std::string post(const std::string& body);
};
