#include "ir/annotate.h"
#include <set>
#include "common/text.h"
#include "ir/print.h"

namespace {

struct Annotator {
  const Ontology& ontology;
  std::set<std::string> seen;

  std::string notes(const std::vector<std::string>& names, const std::string& in) {
    std::string out;
    for (const std::string& name : names) {
      std::string about = ontology.meaning(name);
      if (!about.empty() && seen.insert(name).second) out += in + "// [llmc] " + name + " — " + about + "\n";
    }
    return out;
  }

  std::vector<std::string> lexemes(const Decl& decl) {
    std::vector<std::string> names = {decl.kind};
    if (decl.exported) names.push_back("export");
    names.insert(names.end(), decl.modifiers.begin(), decl.modifiers.end());
    for (const std::string& word : words(decl.type + " " + join(decl.bases, " "))) names.push_back(word);
    for (const Decl& param : decl.params) {
      for (const std::string& word : words(param.type)) names.push_back(word);
    }
    if (decl.hasValue) leaves(decl.value, names);
    if (decl.hasBody) leaves(decl.body, names);
    return names;
  }

  std::string declaration(const Decl& decl, int depth) {
    std::string in = pad(depth);
    std::string out;
    for (const std::string& comment : decl.comments) out += in + "// " + comment + "\n";
    out += notes(lexemes(decl), in) + in + header(decl);
    if (decl.typeLike() && decl.kind != "typedef") {
      out += " {\n";
      for (const Decl& member : decl.members) {
        if (decl.kind == "enum") out += pad(depth + 1) + header(member) + ",\n";
        else out += declaration(member, depth + 1);
      }
      return out + in + "}\n";
    }
    if (!decl.code()) return out + "\n";
    return out + (decl.hasBody ? "\n" + showStatement(decl.body, depth) : ";\n");
  }
};

}  // namespace

std::string irText(const Unit& unit, const Ontology& ontology) {
  Annotator annotator{ontology, {}};
  std::string out = "// LLMC IR: код файла " + unit.path + ".llmc с комментариями программиста и пояснениями лексем [llmc]\n";
  for (const Import& item : unit.imports) {
    for (const std::string& comment : item.comments) out += "// " + comment + "\n";
    out += annotator.notes({item.open ? "virtual" : "import", "import"}, "");
    out += std::string(item.open ? "virtual " : "") + "import \"" + item.name + "\";\n";
  }
  for (const Decl& decl : unit.decls) out += "\n" + annotator.declaration(decl, 0);
  return out;
}
