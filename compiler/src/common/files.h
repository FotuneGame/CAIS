#pragma once
#include <set>
#include <string>
#include <vector>

std::string readFile(const std::string& path);
void writeFile(const std::string& path, const std::string& text);
bool exists(const std::string& path);
std::vector<std::string> listFiles(const std::string& dir);
void copyTree(const std::string& from, const std::string& to, const std::set<std::string>& skip);
std::string relativePath(const std::string& fromFile, const std::string& toFile);
std::string inDir(const std::string& dir, const std::string& command);
int run(const std::string& command, std::string& output);
