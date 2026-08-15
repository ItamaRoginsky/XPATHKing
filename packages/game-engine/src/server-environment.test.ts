import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { evaluateXPath, NODE_ID_ATTR } from "./xpath-evaluator";

/**
 * Regression test for a real bug: evaluateXPath used to read the ambient
 * `Node` / `XPathResult` globals. Vitest's "jsdom" test environment injects
 * those onto globalThis, which hid the bug from every other test in this
 * suite — but the multiplayer server grades submissions in a plain Node.js
 * process via a standalone `new JSDOM(...)` instance, which does NOT touch
 * globalThis. This test constructs a document exactly that way, with no
 * environment-provided globals in play, to make sure it actually works
 * outside the browser/vitest-jsdom context.
 */
describe("evaluateXPath in a bare Node.js process (no ambient DOM globals)", () => {
  it("matches elements against a standalone JSDOM document", () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button></body></html>`,
    );
    const doc = dom.window.document;

    const result = evaluateXPath(doc, doc, "//button[@id='login-btn']");

    expect(result.ok).toBe(true);
    expect(result.matchedNodeIds).toEqual(["n1"]);
  });

  it("supports axes against a standalone JSDOM document", () => {
    const dom = new JSDOM(
      `<!doctype html><html><body><table><tbody><tr><td><small ${NODE_ID_ATTR}="email1">alex@example.com</small></td><td><button ${NODE_ID_ATTR}="del1" class="delete">Delete</button></td></tr></tbody></table></body></html>`,
    );
    const doc = dom.window.document;

    const result = evaluateXPath(
      doc,
      doc,
      "//small[text()='alex@example.com']/ancestor::tr//button[contains(@class,'delete')]",
    );

    expect(result.matchedNodeIds).toEqual(["del1"]);
  });
});
