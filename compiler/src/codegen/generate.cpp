#include "codegen/generate.h"
#include <future>
#include <iostream>
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"
#include "emit/emit.h"

namespace {

struct Job {
  const Unit* unit;
  Prompt prompt;
  std::string extra;
  std::string sum;
};

template <typename Work>
void parallel(std::vector<Job>& jobs, int width, Work work) {
  for (size_t from = 0; from < jobs.size(); from += width) {
    std::vector<std::future<void>> batch;
    for (size_t i = from; i < jobs.size() && i < from + width; i++) {
      batch.push_back(std::async(std::launch::async, work, std::ref(jobs[i])));
    }
    for (auto& item : batch) item.get();
  }
}

}  // namespace

void Generator::report(const std::string& text) {
  std::lock_guard<std::mutex> guard(log);
  std::cout << "  " << text << std::endl;
}

void Generator::write(const Unit& unit, const Prompt& prompt, const std::string& extra) {
  std::vector<std::string> found;
  std::string feedback = extra;
  for (int attempt = 0; attempt < Llm::ATTEMPTS; attempt++) {
    std::vector<Part> parts = answer(unit, llm.ask(prompt.system, prompt.user + feedback));
    std::vector<Part> clean = parts;
    for (Part& part : clean) part.code = stripComments(part.code, ontology.comments());
    found = problems(clean, unit);
    if (found.empty()) {
      for (const Part& part : parts) writeFile(settings.output("ir", project) + "/llm/" + part.path, part.code);
      save(unit, clean);
      report(targetFile(unit) + (parts.size() > 1 ? " и файлов virtual import: " + std::to_string(parts.size() - 1) : ""));
      return;
    }
    report(targetFile(unit) + ": сверка с онтологией не пройдена, попытка " + std::to_string(attempt + 1));
    feedback = extra + "\n## Ошибки сверки предыдущего ответа с онтологией\n- " + join(found, "\n- ") + "\n";
  }
  throw fail(unit.path + ".llmc: код не прошёл сверку с онтологией: " + join(found, "; "));
}

int Generator::generate() {
  std::vector<Job> jobs;
  checkOnly();
  for (const Unit& unit : program.units) {
    if (!unit.open()) continue;
    Job job{&unit, prompt(unit), "", ""};
    job.sum = hashOf(job.prompt.system + job.prompt.user);
    if (selected(unit, state(unit, job.sum))) jobs.push_back(job);
  }
  parallel(jobs, Llm::PARALLEL, [&](Job& job) {
    write(*job.unit, job.prompt, "");
    remember(*job.unit, job.sum);
  });
  return (int)jobs.size();
}

int Generator::repair(const std::string& errors) {
  std::vector<std::string> lines = split(replaceAll(errors, "\\", "/"), '\n');
  std::vector<Job> jobs;
  for (const Unit& unit : program.units) {
    std::string found, code;
    for (const std::string& file : files(unit)) {
      for (size_t i = 0; i < lines.size(); i++) {
        if (lines[i].find(file) == std::string::npos) continue;
        for (size_t j = i; j < lines.size() && j < i + 4; j++) found += lines[j] + "\n";
      }
      code += "=== " + file + "\n" + readFile(settings.output("code", project) + "/" + file);
    }
    if (found.empty()) continue;
    if (!unit.open()) throw fail(unit.path + ".llmc написан без virtual, но его перевод не собирается:\n" + found);
    std::string extra = "\n## Текущий код\n" + code + "\n## Ошибки сборки\n" + found.substr(0, 4000);
    jobs.push_back({&unit, prompt(unit), extra + "\nИсправь ошибки и верни ответ целиком.\n", ""});
  }
  parallel(jobs, Llm::PARALLEL, [&](Job& job) { write(*job.unit, job.prompt, job.extra); });
  return (int)jobs.size();
}
