#include "optimize/optimize.h"
#include <set>
#include "common/text.h"

namespace {

void visit(Decl& decl, Optimized& done) {
  if (decl.hasValue) foldConstants(decl.value, done.folded);
  if (decl.hasBody) {
    foldConstants(decl.body, done.folded);
    dropUnreachable(decl.body, done.unreachable);
  }
  for (Decl& param : decl.params) visit(param, done);
  for (Decl& member : decl.members) visit(member, done);
}

}  // namespace

void mentions(const Decl& decl, std::set<std::string>& found) {
  std::vector<std::string> texts = decl.comments;
  texts.push_back(decl.type);
  texts.insert(texts.end(), decl.bases.begin(), decl.bases.end());
  if (decl.hasValue) leaves(decl.value, texts);
  if (decl.hasBody) leaves(decl.body, texts);
  if (decl.hasSuper) leaves(decl.super, texts);
  for (const std::string& word : words(join(texts, " "))) found.insert(word);
  for (const Decl& param : decl.params) mentions(param, found);
  for (const Decl& member : decl.members) mentions(member, found);
}

int removeDead(Unit& unit) {
  int removed = 0;
  for (bool changed = true; changed;) {
    changed = false;
    for (size_t i = 0; i < unit.decls.size(); i++) {
      if (unit.decls[i].exported || unit.decls[i].name == "main" || unit.decls[i].open()) continue;
      std::set<std::string> found;
      for (size_t j = 0; j < unit.decls.size(); j++) {
        if (j != i) mentions(unit.decls[j], found);
      }
      if (found.count(unit.decls[i].name)) continue;
      unit.decls.erase(unit.decls.begin() + i);
      removed++;
      changed = true;
      break;
    }
  }
  return removed;
}

Optimized optimize(Program& program) {
  Optimized done;
  for (Unit& unit : program.units) {
    for (Decl& decl : unit.decls) visit(decl, done);
    if (!unit.test()) done.removed += removeDead(unit);
  }
  return done;
}
