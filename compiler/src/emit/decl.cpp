#include "common/text.h"
#include "emit/emit.h"
#include "ir/checker.h"

std::string Emitter::params(const Decl& decl) {
  std::vector<std::string> items;
  for (const Decl& param : decl.params) {
    bool optional = endsWith(param.type, "?") && !param.hasValue;
    items.push_back(fill(form("param"), {{"name", param.name}, {"optional", optional ? form("optional") : ""},
                                         {"type", type(param.type)}, {"value", value(param)}}));
  }
  return join(items, ", ");
}

std::string Emitter::value(const Decl& decl) {
  if (decl.hasValue) return " = " + expr(decl.value);
  return decl.open() ? " = " + form("virtual") : "";
}

std::string Emitter::body(const Decl& decl) {
  if (outline) return form("outline");
  if (!decl.hasBody || decl.open()) return "{\n  " + form("virtual") + ";\n}";
  std::string text = block(decl.body, 0);
  if (!decl.hasSuper) return text;
  return "{\n  " + ontology.emit("base") + "(" + join(list(decl.super, false), ", ") + ");" + text.substr(1);
}

std::string Emitter::function(const Decl& decl) {
  std::string async = decl.is("async") ? form("async") : "";
  bool test = unit.test() && decl.params.empty() && !decl.exported && decl.type == "bool";
  if (test) {
    std::string title = replaceAll(decl.comments.empty() ? decl.name : decl.comments[0], "'", "\\'");
    imports.insert(form("testImport"));
    return fill(form("test"), {{"title", title}, {"async", async}, {"await", async.empty() ? "" : ontology.emit("await")}, {"type", type(decl.type)}, {"body", body(decl)}});
  }
  return fill(form("function"), {{"export", decl.exported ? ontology.emit("export") + " " : ""}, {"async", async},
                                 {"name", decl.name}, {"params", params(decl)}, {"type", type(decl.type)}, {"body", body(decl)}});
}

std::string Emitter::member(const Decl& decl, const Decl& owner) {
  std::string access = owner.kind == "interface" ? "" : word(decl, "private") + word(decl, "protected");
  std::map<std::string, std::string> values = {{"access", access}, {"static", word(decl, "static")}, {"name", decl.name},
                                               {"params", params(decl)}, {"type", type(decl.type)}};
  if (decl.kind == "field") {
    bool optional = endsWith(decl.type, "?") && !decl.hasValue;
    values["optional"] = optional ? form("optional") : "";
    values["readonly"] = decl.is("const") ? form("readonly") : "";
    values["value"] = value(decl);
    return fill(form("field"), values);
  }
  if (owner.kind == "interface") return fill(form("signature"), values);
  values["async"] = decl.is("async") ? form("async") : "";
  values["body"] = body(decl);
  return fill(form(decl.kind == "constructor" ? "constructor" : "method"), values);
}

std::string Emitter::members(const Decl& decl) {
  std::string out;
  bool valued = false;
  for (const Decl& item : decl.members) valued = valued || item.hasValue;
  for (const Decl& item : decl.members) {
    if (outline && item.is("private")) continue;
    std::string text = comments(item);
    if (decl.kind != "enum") text += member(item, decl);
    else text += fill(form(valued ? "enumerator" : "enumeratorText"), {{"name", item.name}, {"value", value(item)}});
    out += indent(text);
  }
  return out;
}

std::string Emitter::bases(const Decl& decl, bool interfaces) const {
  std::vector<std::string> found;
  for (const std::string& base : decl.bases) {
    auto symbol = unit.symbols.find(root(base));
    bool contract = symbol != unit.symbols.end() && symbol->second->kind == "interface" && decl.kind != "interface";
    if (contract == interfaces) found.push_back(type(base));
  }
  return found.empty() ? "" : fill(form(interfaces ? "implements" : "extends"), {{"types", join(found, ", ")}});
}

std::string Emitter::typeLike(const Decl& decl) {
  std::string start = decl.exported ? ontology.emit("export") + " " : "";
  if (decl.kind == "typedef") return fill(form("typedef"), {{"export", start}, {"name", decl.name}, {"type", type(decl.type)}});
  std::string generics = decl.generics.empty() ? "" : "<" + join(decl.generics, ", ") + ">";
  return fill(form(decl.kind), {{"export", start}, {"name", decl.name + generics},
                                {"extends", bases(decl, false)}, {"implements", bases(decl, true)}, {"members", members(decl)}});
}
