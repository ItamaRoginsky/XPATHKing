import { describe, expect, it } from "vitest";
import { evaluateXPath } from "./xpath-evaluator";
import { analyzeXPathQuality } from "./quality-analyzer";
import { gradeSubmission } from "./grade-submission";
import type { Challenge } from "@xpath-arena/shared";

function makeDoc(html: string): Document {
  const doc = document.implementation.createHTMLDocument("test");
  doc.body.innerHTML = html;
  return doc;
}

const doc = makeDoc(`<div id="a"><button id="b">Hi</button></div>`);

// Malformed, adversarial, and boundary XPath strings the player could type
// or paste. None of these represent a "correct" answer to any real
// challenge — the only thing under test is that the engine never throws,
// never hangs (ReDoS via the quality-analyzer's regexes, or pathological
// backtracking in a browser's XPath parser), and always returns a
// well-formed, bounded result.
const MALFORMED_INPUTS: string[] = [
  "//",
  "///",
  "[",
  "//div[",
  "//div[@",
  "//button[text()=",
  "(((((",
  "//*[",
  "//div]]]]",
  "'",
  '"',
  "//div[@id='" + "a".repeat(50_000) + "']",
  "/".repeat(20_000),
  "(".repeat(20_000),
  "[".repeat(20_000),
  "\t\n\r ".repeat(5_000),
  "//*[contains(normalize-space(.), '" + "x".repeat(20_000) + "')]",
  "\u{1F451}".repeat(5_000), // crown emoji, surrogate pairs
  "<script>alert(1)</script>",
  "\"><img src=x onerror=alert(1)>",
  "//div[@id=\"'\"><script>\"]",
  "//*" + "[1]".repeat(5_000),
];

const VALID_BUT_UNUSUAL_INPUTS: string[] = [
  "(//button)[1]",
  "//*[contains(normalize-space(.), 'Login')]",
  "//div[count(*) > 3]",
  "//*[not(@disabled)]",
  "//input[@type='text' or @type='email']",
  "//div[.//button]",
  "//button/ancestor::section",
  "//*[@class][1]",
  "//*",
  "/",
];

describe("evaluateXPath / analyzeXPathQuality fuzzing — must never throw or hang", () => {
  for (const xpath of [...MALFORMED_INPUTS, ...VALID_BUT_UNUSUAL_INPUTS]) {
    const label = xpath.length > 40 ? `${xpath.slice(0, 40)}…(${xpath.length} chars)` : xpath;
    it(`evaluateXPath(${JSON.stringify(label)}) resolves quickly without throwing`, () => {
      const start = Date.now();
      let result;
      expect(() => {
        result = evaluateXPath(doc, doc, xpath);
      }).not.toThrow();
      expect(Date.now() - start).toBeLessThan(3000);
      expect(typeof result!.ok).toBe("boolean");
      expect(Number.isFinite(result!.matchCount)).toBe(true);
    });

    it(`analyzeXPathQuality(${JSON.stringify(label)}) stays within [0, 100] without throwing`, () => {
      let quality;
      expect(() => {
        quality = analyzeXPathQuality({ xpath });
      }).not.toThrow();
      expect(quality!.score).toBeGreaterThanOrEqual(0);
      expect(quality!.score).toBeLessThanOrEqual(100);
      expect(Number.isFinite(quality!.score)).toBe(true);
    });
  }
});

describe("gradeSubmission fuzzing against a rule-bearing challenge", () => {
  const challenge: Challenge = {
    id: "t",
    seed: "t",
    difficulty: "beginner",
    category: "basics",
    type: "exact-target",
    template: { templateId: "t", siteName: "t" },
    html: doc.body.innerHTML,
    targetNodeIds: ["b"],
    distractorNodeIds: [],
    objective: "find it",
    rules: [
      { kind: "forbid-attribute", attribute: "id", reason: "no id" },
      { kind: "forbid-index", reason: "no index" },
      { kind: "forbid-absolute-path", reason: "no absolute" },
      { kind: "max-length", length: 20, reason: "too long" },
      { kind: "require-axis", axis: "descendant", reason: "need axis" },
    ],
    referenceSolutions: [{ xpath: "//button" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [],
  };

  for (const xpath of MALFORMED_INPUTS) {
    const label = xpath.length > 40 ? `${xpath.slice(0, 40)}…(${xpath.length} chars)` : xpath;
    it(`gradeSubmission(${JSON.stringify(label)}) returns a well-formed result`, () => {
      let result;
      expect(() => {
        result = gradeSubmission(doc, doc, xpath, challenge);
      }).not.toThrow();
      expect(typeof result!.correct).toBe("boolean");
      expect(Array.isArray(result!.ruleViolations)).toBe(true);
      expect(Number.isFinite(result!.quality.score)).toBe(true);
    });
  }
});
