#include <iostream>
#include "codegen/generate.h"
#include "common/error.h"
#include "common/files.h"
#include "common/text.h"
#include "frontend.h"
#include "ir/checker.h"
#include "link/link.h"
#include "optimize/optimize.h"
#include "settings/vocabulary.h"
#include "options.h"
#ifdef _WIN32
#include <windows.h>
#endif

bool stage(int number, const Options& options, const std::string& text) {
  std::cout << "[" << number << "/8] " << text << std::endl;
  return number < options.until;
}

void link(const Settings& settings, Generator& generator, bool run) {
  Linker linker{settings, generator.project, generator.ontology, false};
  std::vector<std::string> generated;
  for (const Unit& unit : generator.program.units) {
    for (const std::string& file : generator.files(unit)) generated.push_back(file);
  }
  linker.prepare(generated);
  for (int round = 1;; round++) {
    std::string errors = linker.build();
    if (errors.empty()) break;
    bool last = round > settings.json.number("repairs", 3);
    if (last || generator.repair(errors) == 0) throw fail("целевой код не собирается:\n" + errors);
    std::cout << "  исправление по ошибкам сборки и тестов, проход " << round << std::endl;
  }
  linker.publish();
  std::cout << "  готово: " << settings.output("bin", generator.project) << std::endl;
  if (!run) return;
  std::cout << "[8/8] Исполнение: скрипт start" << std::endl;
  std::string output;
  if (linker.script("start", output) != 0) std::cout << output << std::endl;
}

void compile(const Options& options) {
  Settings settings = loadSettings(options.config, options.target);
  Project project = loadProject(options.project);
  Ontology ontology = loadOntology(settings.file("ontologies"), settings.target());
  checkVocabulary(loadDictionary(settings.file("tokens")), loadGrammar(settings.file("grammar")), ontology);
  std::string ir = settings.output("ir", project);
  Frontend frontend{settings, project, ir + "/stages/", {}, {}, {}, {}};

  size_t lines = frontend.preprocessAll();
  std::string files = std::to_string(frontend.files.size());
  if (!stage(1, options, "Препроцессор: файлов " + files + ", строк " + std::to_string(lines))) return;
  if (!stage(2, options, "Лексер: токенов " + std::to_string(frontend.lexAll()))) return;
  if (!stage(3, options, "Парсер: узлов AST " + std::to_string(frontend.parseAll()))) return;

  Program program = frontend.build();
  resolve(program, ontology.extension());
  check(program, ontology);
  if (!stage(4, options, "IR: файлов " + files + ", имена и типы проверены")) return;

  Optimized done = optimize(program);
  bind(program);
  Llm llm;
  Generator generator{settings, project, program, ontology, llm, {}, options.only, options.changed};
  std::string summary = "свёрнуто выражений " + std::to_string(done.folded) + ", удалено недостижимых операторов " +
                        std::to_string(done.unreachable) + ", неиспользуемых объявлений " + std::to_string(done.removed);
  if (!stage(5, options, "Оптимизация: " + summary)) return;

  std::cout << "[6/8] Генерация кода (" << settings.target() << ")" << std::endl;
  std::cout << "  переведено компилятором без LLM: " << generator.translate() << " из " << program.units.size() << std::endl;
  if (options.status) {
    generator.status();
    return;
  }
  if (options.until == 6 && options.plain) return;
  int made = generator.generate();
  std::cout << "  написано LLM (" << llm.model << "): " << made << std::endl;
  if (options.until == 6) return;

  std::cout << "[7/8] Линковка: " << settings.output("code", project) << std::endl;
  link(settings, generator, options.until == 8);
}

int main(int argc, char** argv) {
#ifdef _WIN32
  SetConsoleOutputCP(65001);
#endif
  try {
    compile(options(argc, argv));
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "ошибка: " << error.what() << std::endl;
    return 1;
  }
}
