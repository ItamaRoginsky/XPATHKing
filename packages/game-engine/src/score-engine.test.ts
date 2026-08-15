import { describe, expect, it } from "vitest";
import { computeRoundScore, ComboTracker } from "./score-engine";

describe("computeRoundScore", () => {
  it("awards zero positive points and only a fail penalty on incorrect submission", () => {
    const result = computeRoundScore({
      correct: false,
      timeTakenMs: 1000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 1,
      comboMultiplier: 1,
    });
    expect(result.total).toBeLessThanOrEqual(0);
    expect(result.base).toBe(0);
  });

  it("awards more speed bonus for a faster solve", () => {
    const fast = computeRoundScore({
      correct: true,
      timeTakenMs: 1000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    const slow = computeRoundScore({
      correct: true,
      timeTakenMs: 29000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    expect(fast.speed).toBeGreaterThan(slow.speed);
    expect(fast.total).toBeGreaterThan(slow.total);
  });

  it("rewards higher quality tiers with more points", () => {
    const legendary = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "legendary",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    const fragile = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "fragile",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    expect(legendary.total).toBeGreaterThan(fragile.total);
  });

  it("applies the combo multiplier to positive earnings", () => {
    const noCombo = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    const withCombo = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 2,
    });
    expect(withCombo.total).toBeGreaterThan(noCombo.total);
  });

  it("subtracts hint penalties from the total", () => {
    const noHints = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 0,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    const withHints = computeRoundScore({
      correct: true,
      timeTakenMs: 5000,
      timeLimitSeconds: 30,
      qualityTier: "clean",
      isFirstSolve: false,
      hintsUsed: 2,
      failedAttempts: 0,
      comboMultiplier: 1,
    });
    expect(withHints.total).toBeLessThan(noHints.total);
  });
});

describe("ComboTracker", () => {
  it("starts at multiplier 1", () => {
    const tracker = new ComboTracker();
    expect(tracker.multiplier).toBe(1);
  });

  it("increases the multiplier on consecutive correct answers", () => {
    const tracker = new ComboTracker();
    for (let i = 0; i < 8; i++) tracker.registerResult(true, 0);
    expect(tracker.multiplier).toBeGreaterThan(1);
  });

  it("resets the streak on an incorrect answer", () => {
    const tracker = new ComboTracker();
    for (let i = 0; i < 8; i++) tracker.registerResult(true, 0);
    const highMultiplier = tracker.multiplier;
    tracker.registerResult(false, 0);
    expect(tracker.multiplier).toBeLessThan(highMultiplier);
    expect(tracker.currentStreak).toBe(0);
  });

  it("resets the streak on excessive hint usage", () => {
    const tracker = new ComboTracker();
    for (let i = 0; i < 6; i++) tracker.registerResult(true, 0);
    tracker.registerResult(true, 3);
    expect(tracker.currentStreak).toBe(0);
  });
});
