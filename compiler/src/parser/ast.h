#pragma once
#include <string>
#include <vector>

struct Node {
  std::string kind;
  std::string text;
  std::string file;
  int line = 0;
  std::vector<Node> kids;
  mutable std::string type;
  mutable bool builtin = false;

  const Node* find(const std::string& name) const {
    for (const Node& kid : kids) {
      if (kid.kind == name) return &kid;
    }
    return nullptr;
  }

  std::vector<const Node*> all(const std::string& name) const {
    std::vector<const Node*> found;
    for (const Node& kid : kids) {
      if (kid.kind == name) found.push_back(&kid);
    }
    return found;
  }
};
