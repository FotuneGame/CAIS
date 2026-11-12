#pragma once
#include "lexer/lexer.h"
#include "parser/grammar.h"
#include "settings/ontology.h"

void checkVocabulary(const Dictionary& dictionary, const Grammar& grammar, const Ontology& ontology);
