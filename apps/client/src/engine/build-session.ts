import type { Challenge, ChallengeCategory, Difficulty } from "@xpath-arena/shared";
import { CATEGORY_ORDER, generateChallenge } from "@xpath-arena/challenge-engine";

function seedFor(prefix: string, i: number): string {
  return `${prefix}-${i}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function buildChapterSession(category: ChallengeCategory, difficulty: Difficulty, count = 5): Challenge[] {
  const prefix = `practice-${category}`;
  return Array.from({ length: count }, (_, i) => generateChallenge({ seed: seedFor(prefix, i), category, difficulty }));
}

export function buildQuickPracticeSession(difficulty: Difficulty, count = 5): Challenge[] {
  const categories = CATEGORY_ORDER.filter((c) => c !== "mastery");
  const shuffled = [...categories].sort(() => Math.random() - 0.5);
  const prefix = "quick-practice";
  return Array.from({ length: count }, (_, i) => {
    const category = shuffled[i % shuffled.length]!;
    return generateChallenge({ seed: seedFor(prefix, i), category, difficulty });
  });
}

export function buildSpeedRunBatch(difficulty: Difficulty, batchStart: number, count = 8): Challenge[] {
  const easyCategories: ChallengeCategory[] = ["basics", "attributes", "text"];
  const prefix = "speedrun";
  return Array.from({ length: count }, (_, i) => {
    const category = easyCategories[(batchStart + i) % easyCategories.length]!;
    return generateChallenge({ seed: seedFor(prefix, batchStart + i), category, difficulty });
  });
}

export function buildBossSession(): Challenge[] {
  const prefix = "boss";
  return [generateChallenge({ seed: seedFor(prefix, 0), category: "mastery", difficulty: "expert" })];
}

export function weakestCategory(mastery: Record<ChallengeCategory, { score: number; attempts: number }>): ChallengeCategory {
  const withAttempts = CATEGORY_ORDER.filter((c) => c !== "mastery").map((c) => ({ c, m: mastery[c] }));
  withAttempts.sort((a, b) => {
    if (a.m.attempts === 0 && b.m.attempts === 0) return 0;
    if (a.m.attempts === 0) return -1;
    if (b.m.attempts === 0) return 1;
    return a.m.score - b.m.score;
  });
  return withAttempts[0]!.c;
}
