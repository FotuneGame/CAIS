#pragma once
#include <set>
#include "ir/ir.h"

struct Optimized {
  int folded = 0;
  int unreachable = 0;
  int removed = 0;
};

Optimized optimize(Program& program);
void foldConstants(Node& node, int& count);
void dropUnreachable(Node& node, int& count);
int removeDead(Unit& unit);
void mentions(const Decl& decl, std::set<std::string>& found);
