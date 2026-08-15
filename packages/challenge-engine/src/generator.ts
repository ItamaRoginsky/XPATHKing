import { SeededRandom } from "@xpath-arena/game-engine";
import type { Challenge, ChallengeCategory, Difficulty } from "@xpath-arena/shared";
import { basicsVariants } from "./factories/basics";
import { attributesVariants } from "./factories/attributes";
import { textVariants } from "./factories/text";
import { relationshipsVariants } from "./factories/relationships";
import { conditionsVariants } from "./factories/conditions";
import { axesVariants } from "./factories/axes";
import { functionsVariants } from "./factories/functions";
import { realWorldVariants } from "./factories/real-world";
import { dynamicDomVariants } from "./factories/dynamic-dom";
import { masteryVariants } from "./factories/mastery";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => Omit<Challenge, "id" | "seed">;

const VARIANTS_BY_CATEGORY: Record<ChallengeCategory, Variant[]> = {
  basics: basicsVariants,
  attributes: attributesVariants,
  text: textVariants,
  relationships: relationshipsVariants,
  conditions: conditionsVariants,
  axes: axesVariants,
  functions: functionsVariants,
  "real-world": realWorldVariants,
  "dynamic-dom": dynamicDomVariants,
  mastery: masteryVariants,
};

export const CATEGORY_ORDER: ChallengeCategory[] = [
  "basics",
  "attributes",
  "text",
  "relationships",
  "conditions",
  "axes",
  "functions",
  "real-world",
  "dynamic-dom",
  "mastery",
];

export interface GenerateOptions {
  seed: string;
  category: ChallengeCategory;
  difficulty: Difficulty;
}

/**
 * Deterministic: the same seed + category + difficulty always yields the
 * same Challenge. This is what lets two duel clients derive an identical
 * round from nothing but a shared seed string.
 */
export function generateChallenge(opts: GenerateOptions): Challenge {
  const rng = new SeededRandom(opts.seed);
  const variants = VARIANTS_BY_CATEGORY[opts.category];
  const variant = rng.pick(variants);
  const draft = variant(rng, opts.difficulty);
  return {
    ...draft,
    id: `${opts.seed}::${opts.category}`,
    seed: opts.seed,
  };
}

export function generateRoundSeed(matchSeed: string, roundNumber: number): string {
  return `${matchSeed}-round-${roundNumber}`;
}

export function categoryForRound(roundNumber: number, totalRounds: number): ChallengeCategory {
  if (roundNumber === totalRounds) return "mastery";
  const progressCategories = CATEGORY_ORDER.filter((c) => c !== "mastery");
  const idx = Math.min(progressCategories.length - 1, roundNumber - 1);
  return progressCategories[idx]!;
}
