#pragma once
#include <string>
#include <vector>

struct Line {
  std::string text;
  std::string file;
  int number = 0;
};

struct Source {
  std::vector<Line> lines;
};

Source preprocess(const std::string& file);
std::vector<Line> readLines(const std::string& file);
