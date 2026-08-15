import type { QualityTier, ScoreBreakdown } from "@xpath-arena/shared";

export interface ScoreInput {
  correct: boolean;
  timeTakenMs: number;
  timeLimitSeconds: number;
  qualityTier: QualityTier;
  isFirstSolve: boolean;
  hintsUsed: number;
  failedAttempts: number;
  comboMultiplier: number;
}

const BASE_CORRECT = 1000;
const MAX_SPEED_BONUS = 350;
const FIRST_SOLVE_BONUS = 100;
const HINT_PENALTY = 150;
const FAIL_PENALTY = 100;
const MAX_HINT_PENALTIES = 4;
const MAX_FAIL_PENALTIES = 3;

const QUALITY_BONUS: Record<QualityTier, number> = {
  legendary: 350,
  excellent: 250,
  clean: 150,
  valid: 50,
  fragile: 0,
};

export function computeRoundScore(input: ScoreInput): ScoreBreakdown {
  if (!input.correct) {
    const failPenalty = Math.min(MAX_FAIL_PENALTIES, input.failedAttempts) * FAIL_PENALTY;
    return {
      base: 0,
      speed: 0,
      quality: 0,
      firstSolve: 0,
      hintPenalty: Math.min(MAX_HINT_PENALTIES, input.hintsUsed) * HINT_PENALTY,
      failPenalty,
      comboMultiplier: 1,
      total: -Math.min(MAX_FAIL_PENALTIES, input.failedAttempts) * FAIL_PENALTY,
    };
  }

  const base = BASE_CORRECT;

  const timeLimitMs = Math.max(1, input.timeLimitSeconds * 1000);
  const speedRatio = Math.max(0, 1 - input.timeTakenMs / timeLimitMs);
  const speed = Math.round(MAX_SPEED_BONUS * speedRatio);

  const quality = QUALITY_BONUS[input.qualityTier];
  const firstSolve = input.isFirstSolve ? FIRST_SOLVE_BONUS : 0;

  const hintPenalty = Math.min(MAX_HINT_PENALTIES, input.hintsUsed) * HINT_PENALTY;
  const failPenalty = Math.min(MAX_FAIL_PENALTIES, input.failedAttempts) * FAIL_PENALTY;

  const positive = base + speed + quality + firstSolve;
  const multiplied = Math.round(positive * input.comboMultiplier);
  const total = Math.max(0, multiplied - hintPenalty - failPenalty);

  return {
    base,
    speed,
    quality,
    firstSolve,
    hintPenalty,
    failPenalty,
    comboMultiplier: input.comboMultiplier,
    total,
  };
}

const COMBO_STEPS = [1, 1.25, 1.5, 2, 3];

export class ComboTracker {
  private streak = 0;

  get multiplier(): number {
    const stepIndex = Math.min(COMBO_STEPS.length - 1, Math.floor(this.streak / 2));
    return COMBO_STEPS[stepIndex] ?? 1;
  }

  get currentStreak(): number {
    return this.streak;
  }

  registerResult(correct: boolean, hintsUsed: number): number {
    const brokeCombo = !correct || hintsUsed >= 3;
    if (brokeCombo) {
      this.streak = 0;
    } else {
      this.streak += 1;
    }
    return this.multiplier;
  }

  reset(): void {
    this.streak = 0;
  }
}
