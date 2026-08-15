import { describe, expect, it } from "vitest";
import { gradeSubmission } from "@xpath-arena/game-engine";
import { generateChallenge, CATEGORY_ORDER, generateRoundSeed, categoryForRound } from "./generator";

function docFor(html: string): Document {
  const doc = document.implementation.createHTMLDocument("arena");
  doc.body.innerHTML = html;
  return doc;
}

describe("generateChallenge", () => {
  it("is deterministic for a given seed/category/difficulty", () => {
    const a = generateChallenge({ seed: "duel-X7KP-round-3", category: "relationships", difficulty: "intermediate" });
    const b = generateChallenge({ seed: "duel-X7KP-round-3", category: "relationships", difficulty: "intermediate" });
    expect(a.html).toEqual(b.html);
    expect(a.objective).toEqual(b.objective);
    expect(a.targetNodeIds).toEqual(b.targetNodeIds);
  });

  it("produces a different challenge for a different seed", () => {
    const a = generateChallenge({ seed: "seed-1", category: "basics", difficulty: "beginner" });
    const b = generateChallenge({ seed: "seed-2", category: "basics", difficulty: "beginner" });
    expect(a.html).not.toEqual(b.html);
  });

  it("every category produces a challenge whose reference solution actually grades as correct", () => {
    for (const category of CATEGORY_ORDER) {
      for (let i = 0; i < 15; i++) {
        const challenge = generateChallenge({ seed: `solvability-${category}-${i}`, category, difficulty: "advanced" });
        const doc = docFor(challenge.html);
        expect(challenge.referenceSolutions.length).toBeGreaterThan(0);

        const primary = challenge.referenceSolutions[0]!;
        const result = gradeSubmission(doc, doc, primary.xpath, challenge);
        expect(
          result.correct,
          `category=${category} seed=solvability-${category}-${i} xpath="${primary.xpath}" objective="${challenge.objective}" matched=${JSON.stringify(result.matchedNodeIds)} target=${JSON.stringify(challenge.targetNodeIds)} violations=${JSON.stringify(result.ruleViolations)}`,
        ).toBe(true);
      }
    }
  });

  it("every reference solution for a challenge (not just the first) grades as correct", () => {
    for (const category of CATEGORY_ORDER) {
      const challenge = generateChallenge({ seed: `all-refs-${category}`, category, difficulty: "advanced" });
      const doc = docFor(challenge.html);
      for (const ref of challenge.referenceSolutions) {
        const result = gradeSubmission(doc, doc, ref.xpath, challenge);
        expect(result.correct, `category=${category} xpath="${ref.xpath}"`).toBe(true);
      }
    }
  });

  it("target node ids always resolve to elements actually present in the html", () => {
    for (const category of CATEGORY_ORDER) {
      const challenge = generateChallenge({ seed: `presence-${category}`, category, difficulty: "advanced" });
      const doc = docFor(challenge.html);
      for (const id of challenge.targetNodeIds) {
        const el = doc.querySelector(`[data-xa-id="${id}"]`);
        expect(el, `category=${category} missing target node ${id}`).not.toBeNull();
      }
    }
  });
});

describe("round/category helpers", () => {
  it("generateRoundSeed is deterministic and unique per round", () => {
    const r1 = generateRoundSeed("duel-X7KP", 1);
    const r2 = generateRoundSeed("duel-X7KP", 2);
    expect(r1).not.toEqual(r2);
    expect(generateRoundSeed("duel-X7KP", 1)).toEqual(r1);
  });

  it("categoryForRound maps the final round to mastery (boss)", () => {
    expect(categoryForRound(5, 5)).toBe("mastery");
    expect(categoryForRound(1, 5)).not.toBe("mastery");
  });
});
