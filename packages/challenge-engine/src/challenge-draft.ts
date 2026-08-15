import type { Challenge } from "@xpath-arena/shared";

export type ChallengeDraft = Omit<Challenge, "id" | "seed">;
