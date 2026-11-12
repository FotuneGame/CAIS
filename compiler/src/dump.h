#pragma once
#include <string>
#include <vector>
#include "ir/ir.h"
#include "lexer/lexer.h"
#include "preprocess/preprocess.h"

std::string dumpSource(const Source& source);
std::string dumpTokens(const std::vector<Token>& tokens);
std::string dumpAst(const Node& node, int depth = 0);
int countNodes(const Node& node);
