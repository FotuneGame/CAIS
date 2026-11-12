#pragma once
#include <vector>
#include "lexer/lexer.h"
#include "parser/ast.h"
#include "parser/grammar.h"

Node parse(const Grammar& grammar, const std::vector<Token>& tokens);
