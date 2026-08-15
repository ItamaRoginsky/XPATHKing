import { describe, expect, it } from "vitest";
import { evaluateXPath, NODE_ID_ATTR } from "./xpath-evaluator";

function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument("test");
  doc.body.innerHTML = html;
  return doc;
}

describe("evaluateXPath", () => {
  it("matches a simple tag selector", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1">Login</button>`);
    const result = evaluateXPath(doc, doc, "//button");
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedNodeIds).toEqual(["n1"]);
  });

  it("matches by attribute", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button><button ${NODE_ID_ATTR}="n2">Other</button>`);
    const result = evaluateXPath(doc, doc, "//button[@id='login-btn']");
    expect(result.matchedNodeIds).toEqual(["n1"]);
  });

  it("returns zero matches for a nonexistent selector", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1">Login</button>`);
    const result = evaluateXPath(doc, doc, "//textarea");
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBe(0);
  });

  it("reports invalid syntax without throwing", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1">Login</button>`);
    const result = evaluateXPath(doc, doc, "//button[");
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("matches text content", () => {
    const doc = makeDoc(
      `<button ${NODE_ID_ATTR}="n1">Login</button><button ${NODE_ID_ATTR}="n2">Logout</button>`,
    );
    const result = evaluateXPath(doc, doc, "//button[text()='Login']");
    expect(result.matchedNodeIds).toEqual(["n1"]);
  });

  it("supports ancestor axis", () => {
    const doc = makeDoc(
      `<table><tbody><tr ${NODE_ID_ATTR}="row1"><td><small ${NODE_ID_ATTR}="email1">alex@example.com</small></td><td><button ${NODE_ID_ATTR}="del1" class="delete">Delete</button></td></tr></tbody></table>`,
    );
    const result = evaluateXPath(
      doc,
      doc,
      "//small[text()='alex@example.com']/ancestor::tr//button[contains(@class,'delete')]",
    );
    expect(result.matchedNodeIds).toEqual(["del1"]);
  });

  it("treats blank input as zero matches, not an error", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1">Login</button>`);
    const result = evaluateXPath(doc, doc, "   ");
    expect(result.ok).toBe(true);
    expect(result.matchCount).toBe(0);
  });
});
