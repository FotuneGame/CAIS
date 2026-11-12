#include "preprocess/preprocess.h"

Source preprocess(const std::string& file) {
  return Source{readLines(file)};
}
