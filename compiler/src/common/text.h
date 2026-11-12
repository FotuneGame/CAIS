#pragma once
#include <map>
#include <string>
#include <vector>

std::vector<std::string> split(const std::string& text, char separator);
std::string join(const std::vector<std::string>& parts, const std::string& separator);
std::string trim(const std::string& text);
std::string replaceAll(std::string text, const std::string& from, const std::string& to);
bool startsWith(const std::string& text, const std::string& prefix);
bool endsWith(const std::string& text, const std::string& suffix);
std::string kebab(const std::string& name);
std::string pascal(const std::string& name);
std::vector<std::string> words(const std::string& text);
std::string hashOf(const std::string& text);
std::string fill(const std::string& form, const std::map<std::string, std::string>& values);
std::string indent(const std::string& text);
std::string squeeze(const std::string& text);
std::string lower(const std::string& text);
