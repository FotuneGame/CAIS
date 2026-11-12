#include "frontend.h"
#include <filesystem>
#include "common/files.h"
#include "common/text.h"
#include "dump.h"

size_t Frontend::preprocessAll() {
  size_t lines = 0;
  std::filesystem::remove_all(dump);
  for (const SourceFile& file : project.files) {
    if (!endsWith(file.path, ".llmc")) continue;
    files.push_back(file);
    sources.push_back(preprocess(file.from));
    lines += sources.back().lines.size();
    writeFile(dump + file.path + ".pp", dumpSource(sources.back()));
  }
  return lines;
}

size_t Frontend::lexAll() {
  Dictionary dictionary = loadDictionary(settings.file("tokens"));
  size_t count = 0;
  for (size_t i = 0; i < files.size(); i++) {
    tokens.push_back(lex(sources[i], dictionary));
    count += tokens.back().size();
    writeFile(dump + files[i].path + ".tokens", dumpTokens(tokens.back()));
  }
  return count;
}

int Frontend::parseAll() {
  Grammar grammar = loadGrammar(settings.file("grammar"));
  int nodes = 0;
  for (size_t i = 0; i < files.size(); i++) {
    trees.push_back(parse(grammar, tokens[i]));
    nodes += countNodes(trees.back());
    writeFile(dump + files[i].path + ".ast", dumpAst(trees.back()));
  }
  return nodes;
}

Program Frontend::build() const {
  Program program;
  for (size_t i = 0; i < files.size(); i++) {
    std::string path = files[i].path.substr(0, files[i].path.size() - 5);
    program.units.push_back(buildUnit(trees[i], path));
    program.units.back().file = files[i].from;
    program.units.back().digest = hashOf(dumpSource(sources[i]));
  }
  return program;
}
