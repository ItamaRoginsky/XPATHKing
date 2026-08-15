import { describe, expect, it } from "vitest";
import { analyzeXPathQuality } from "./quality-analyzer";

describe("analyzeXPathQuality", () => {
  it("rates an absolute indexed path as fragile or valid at best", () => {
    const report = analyzeXPathQuality({ xpath: "/html/body/div[2]/div[3]/div[1]/button" });
    expect(["fragile", "valid"]).toContain(report.tier);
  });

  it("rates a data-testid selector highly", () => {
    const report = analyzeXPathQuality({ xpath: "//button[@data-testid='checkout']" });
    expect(["excellent", "legendary"]).toContain(report.tier);
  });

  it("scores a stable, content-anchored relationship selector as excellent or legendary", () => {
    const report = analyzeXPathQuality({ xpath: "//article[.//h3[text()='MacBook Pro']]//button" });
    expect(report.score).toBeGreaterThanOrEqual(75);
  });

  it("always ranks the absolute path lower than the semantic one", () => {
    const bad = analyzeXPathQuality({ xpath: "/html/body/div[2]/div[3]/div[1]/button" });
    const good = analyzeXPathQuality({ xpath: "//button[@data-testid='checkout']" });
    expect(good.score).toBeGreaterThan(bad.score);
  });

  it("penalizes rule violations", () => {
    const clean = analyzeXPathQuality({ xpath: "//button[@id='login-btn']" });
    const violating = analyzeXPathQuality({ xpath: "//button[@id='login-btn']", ruleViolations: ["Challenge forbids @id"] });
    expect(violating.score).toBeLessThan(clean.score);
  });
});
