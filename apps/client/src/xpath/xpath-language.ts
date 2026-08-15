import { StreamLanguage, type StringStream } from "@codemirror/language";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { autocompletion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";

const AXES = [
  "ancestor",
  "ancestor-or-self",
  "attribute",
  "child",
  "descendant",
  "descendant-or-self",
  "following",
  "following-sibling",
  "namespace",
  "parent",
  "preceding",
  "preceding-sibling",
  "self",
];

const FUNCTIONS = [
  "contains",
  "starts-with",
  "ends-with",
  "normalize-space",
  "text",
  "last",
  "position",
  "not",
  "string",
  "number",
  "count",
  "concat",
  "substring",
  "translate",
];

const OPERATORS = ["and", "or", "not", "div", "mod"];

export const xpathStreamLanguage = StreamLanguage.define<{ inString: false | '"' | "'" }>({
  startState: () => ({ inString: false }),
  token(stream: StringStream, state) {
    if (state.inString) {
      const quote = state.inString;
      if (stream.skipTo(quote)) {
        stream.next();
        state.inString = false;
      } else {
        stream.skipToEnd();
      }
      return "string";
    }

    if (stream.eatSpace()) return null;

    const ch = stream.peek();

    if (ch === '"' || ch === "'") {
      state.inString = ch;
      stream.next();
      return "string";
    }

    if (stream.match(/^\d+(\.\d+)?/)) return "number";

    if (stream.match("::")) return "operator";
    if (stream.match("//") || stream.match("/")) return "punctuation";
    if (stream.match(/^[()[\]]/)) return "bracket";
    if (stream.match("@")) return "attributeName";
    if (stream.match(/^[=!<>]=?|[+\-*|]/)) return "operator";
    if (stream.match(",")) return "punctuation";
    if (stream.match(".")) return "keyword";

    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_-]*/)) {
      const word = stream.current();
      const lookaheadOpenParen = stream.peek() === "(";
      if (AXES.includes(word) && (stream.string.slice(stream.pos, stream.pos + 2) === "::" )) return "typeName";
      if (lookaheadOpenParen && FUNCTIONS.includes(word)) return "function";
      if (OPERATORS.includes(word)) return "keyword";
      return "variableName";
    }

    stream.next();
    return null;
  },
});

export const xpathHighlightStyle = HighlightStyle.define([
  { tag: t.string, color: "#3ddc97" },
  { tag: t.number, color: "#ffb454" },
  { tag: t.operator, color: "#9b8bff" },
  { tag: t.punctuation, color: "#5c657c" },
  { tag: t.squareBracket, color: "#97a2ba" },
  { tag: t.paren, color: "#97a2ba" },
  { tag: t.attributeName, color: "#4fd8ff" },
  { tag: t.typeName, color: "#ff9edb" },
  { tag: t.function(t.variableName), color: "#4fd8ff" },
  { tag: t.keyword, color: "#9b8bff" },
  { tag: t.variableName, color: "#f0f3fa" },
]);

export function xpathSyntaxHighlighting() {
  return syntaxHighlighting(xpathHighlightStyle);
}

const SNIPPETS: { label: string; type: string; detail: string }[] = [
  ...AXES.map((a) => ({ label: `${a}::`, type: "keyword", detail: "axis" })),
  ...FUNCTIONS.map((f) => ({ label: `${f}(`, type: "function", detail: "function" })),
  { label: "text()", type: "function", detail: "node text" },
  { label: "and", type: "keyword", detail: "operator" },
  { label: "or", type: "keyword", detail: "operator" },
  { label: "not(", type: "function", detail: "operator" },
];

function xpathCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\w:-]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;
  return {
    from: word.from,
    options: SNIPPETS.map((s) => ({ label: s.label, type: s.type, detail: s.detail })),
    validFor: /^[\w:-]*$/,
  };
}

export function xpathAutocomplete() {
  return autocompletion({ override: [xpathCompletionSource] });
}
