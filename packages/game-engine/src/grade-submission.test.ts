import { describe, expect, it } from "vitest";
import type { Challenge } from "@xpath-arena/shared";
import { gradeSubmission } from "./grade-submission";
import { NODE_ID_ATTR } from "./xpath-evaluator";

function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument("test");
  doc.body.innerHTML = html;
  return doc;
}

function baseChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: "c1",
    seed: "s1",
    difficulty: "beginner",
    category: "basics",
    type: "exact-target",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: "",
    targetNodeIds: ["n1"],
    distractorNodeIds: ["n2"],
    objective: "Find the button",
    rules: [],
    referenceSolutions: [{ xpath: "//button[@id='login-btn']" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [],
    ...overrides,
  };
}

describe("gradeSubmission", () => {
  it("marks an exact unique match as correct", () => {
    const doc = makeDoc(
      `<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button><button ${NODE_ID_ATTR}="n2">Other</button>`,
    );
    const result = gradeSubmission(doc, doc, "//button[@id='login-btn']", baseChallenge());
    expect(result.correct).toBe(true);
    expect(result.exactMatch).toBe(true);
  });

  it("marks an ambiguous match (too many results) as incorrect", () => {
    const doc = makeDoc(
      `<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button><button ${NODE_ID_ATTR}="n2">Other</button>`,
    );
    const result = gradeSubmission(doc, doc, "//button", baseChallenge());
    expect(result.correct).toBe(false);
    expect(result.matchedNodeIds).toEqual(["n1", "n2"]);
  });

  it("marks the wrong single element as incorrect", () => {
    const doc = makeDoc(
      `<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button><button ${NODE_ID_ATTR}="n2">Other</button>`,
    );
    const result = gradeSubmission(doc, doc, "//button[text()='Other']", baseChallenge());
    expect(result.correct).toBe(false);
    expect(result.matchedNodeIds).toEqual(["n2"]);
  });

  it("marks invalid XPath as incorrect without throwing", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button>`);
    const result = gradeSubmission(doc, doc, "//button[", baseChallenge());
    expect(result.correct).toBe(false);
  });

  it("fails a correct-target submission that violates a forbid-attribute rule", () => {
    const doc = makeDoc(`<button ${NODE_ID_ATTR}="n1" id="login-btn">Login</button>`);
    const challenge = baseChallenge({
      targetNodeIds: ["n1"],
      distractorNodeIds: [],
      rules: [{ kind: "forbid-attribute", attribute: "id", reason: "no ids allowed" }],
    });
    const result = gradeSubmission(doc, doc, "//button[@id='login-btn']", challenge);
    expect(result.exactMatch).toBe(true);
    expect(result.correct).toBe(false);
    expect(result.ruleViolations).toContain("no ids allowed");
  });

  it("supports multi-match targets", () => {
    const doc = makeDoc(
      `<span ${NODE_ID_ATTR}="n1" class="badge">Sold Out</span><span ${NODE_ID_ATTR}="n2" class="badge">In Stock</span><span ${NODE_ID_ATTR}="n3" class="badge">Sold Out</span>`,
    );
    const challenge = baseChallenge({ targetNodeIds: ["n1", "n3"], distractorNodeIds: ["n2"] });
    const result = gradeSubmission(doc, doc, "//span[text()='Sold Out']", challenge);
    expect(result.correct).toBe(true);
  });
});
