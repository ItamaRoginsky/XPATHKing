export type QualityTier = "legendary" | "excellent" | "clean" | "valid" | "fragile";

export interface QualityReport {
  score: number;
  tier: QualityTier;
  reasons: string[];
  warnings: string[];
}

export interface EvaluationResult {
  ok: boolean;
  error?: string;
  matchedNodeIds: string[];
  matchCount: number;
}

export interface SubmissionResult {
  correct: boolean;
  exactMatch: boolean;
  matchedNodeIds: string[];
  quality: QualityReport;
  ruleViolations: string[];
}

export interface ScoreBreakdown {
  base: number;
  speed: number;
  quality: number;
  firstSolve: number;
  hintPenalty: number;
  failPenalty: number;
  comboMultiplier: number;
  total: number;
}

export interface Submission {
  challengeId: string;
  xpath: string;
  timeTakenMs: number;
  hintsUsed: number;
  failedAttempts: number;
  playerId: string;
}
