#include "codegen/llm.h"
#include <atomic>
#include <chrono>
#include <cstdlib>
#include <filesystem>
#include <thread>
#include "common/error.h"
#include "common/files.h"
#include "common/json.h"
#include "common/text.h"

namespace fs = std::filesystem;

namespace {

std::atomic<int> counter{0};

std::string environment(const std::string& name, bool required) {
  const char* value = std::getenv(name.c_str());
  if (value && *value) return value;
  if (required) throw fail("не задана переменная окружения " + name + ": нужны LLM_URL, LLM_MODEL и, если есть, LLM_TOKEN");
  return "";
}

std::string temporary(const std::string& text) {
  auto stamp = std::chrono::steady_clock::now().time_since_epoch().count();
  std::string name = "llmc-" + std::to_string(stamp) + "-" + std::to_string(counter++);
  std::string path = (fs::temp_directory_path() / name).string();
  writeFile(path, text);
  return path;
}

}  // namespace

Llm::Llm() : model(environment("LLM_MODEL", false)), url(environment("LLM_URL", false)), token(environment("LLM_TOKEN", false)) {}

std::string Llm::post(const std::string& body) {
  std::string headers = "Content-Type: application/json\n";
  if (!token.empty()) headers += "Authorization: Bearer " + token + "\n";
  std::string headerFile = temporary(headers);
  std::string bodyFile = temporary(body);
  std::string address = url + "/chat/completions";
  std::string output;
  int code = run("curl -sS --max-time " + std::to_string(TIMEOUT) + " -X POST \"" + address + "\" -H \"@" +
                     headerFile + "\" --data-binary \"@" + bodyFile + "\"",
                 output);
  fs::remove(headerFile);
  fs::remove(bodyFile);
  if (code != 0) throw fail("LLM недоступна (" + address + "): " + trim(output));
  return output;
}

std::string Llm::ask(const std::string& system, const std::string& user) {
  if (url.empty() || model.empty()) environment(url.empty() ? "LLM_URL" : "LLM_MODEL", true);
  Json messages = Json::raw(Json::Array, "");
  for (const auto& part : {std::make_pair("system", system), std::make_pair("user", user)}) {
    Json message;
    message.set("role", Json::of(part.first));
    message.set("content", Json::of(part.second));
    messages.items.push_back(message);
  }
  Json body;
  body.set("model", Json::of(model));
  body.set("messages", messages);
  body.set("temperature", Json::raw(Json::Number, "0"));
  body.set("stream", Json::raw(Json::Bool, "false"));

  std::string error;
  for (int attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      std::string answer = post(dumpJson(body));
      Json response = parseJson(answer, "ответ LLM");
      const Json& choices = response.at("choices");
      if (choices.items.empty()) throw fail("ответ LLM без choices: " + answer.substr(0, 300));
      return choices.items[0].at("message").str("content");
    } catch (const Error& problem) {
      error = problem.what();
      std::this_thread::sleep_for(std::chrono::seconds(3 * (attempt + 1)));
    }
  }
  throw fail(error);
}
