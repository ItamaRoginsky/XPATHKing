import type { EvaluationResult } from "@xpath-arena/shared";

export const NODE_ID_ATTR = "data-xa-id";

// Standardized DOM constants, inlined rather than read off the ambient
// `Node`/`XPathResult` globals. Those globals only exist in a real browser
// or in test environments that inject them (e.g. vitest's jsdom
// environment) — this same code also runs inside a plain Node.js process
// for server-side authoritative grading (a bare `new JSDOM(...)` instance
// does not touch `globalThis`), where they'd otherwise be undefined.
const ORDERED_NODE_SNAPSHOT_TYPE = 7;
const ELEMENT_NODE = 1;

/**
 * Thin, defensive wrapper around the browser's standards-compliant
 * document.evaluate. Never throws — syntax errors and runtime errors
 * both surface as EvaluationResult.ok === false so the UI can render
 * calm inline feedback instead of a crash.
 */
export function evaluateXPath(doc: Document, contextNode: Node, xpath: string): EvaluationResult {
  const trimmed = xpath.trim();
  if (!trimmed) {
    return { ok: true, matchedNodeIds: [], matchCount: 0 };
  }

  try {
    const result = doc.evaluate(
      trimmed,
      contextNode,
      null,
      ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );

    const ids: string[] = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeType === ELEMENT_NODE) {
        const id = (node as Element).getAttribute(NODE_ID_ATTR);
        if (id) ids.push(id);
      } else if (node) {
        // Non-element result (attribute/text/etc.) — count it, but it can
        // never satisfy an element-based challenge target.
        ids.push(`__nonelement_${i}`);
      }
    }

    return { ok: true, matchedNodeIds: ids, matchCount: result.snapshotLength };
  } catch (err) {
    return {
      ok: false,
      error: describeXPathError(err),
      matchedNodeIds: [],
      matchCount: 0,
    };
  }
}

function describeXPathError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/unbalanced|mismatched|invalid.*brack/i.test(raw)) return "Unbalanced brackets";
  if (/invalid expression|parse error|syntaxerr/i.test(raw)) return "Invalid XPath syntax";
  if (/unknown function/i.test(raw)) return "Unknown function";
  return "Invalid XPath";
}
