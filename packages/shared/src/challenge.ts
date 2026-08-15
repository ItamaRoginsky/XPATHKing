export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type ChallengeCategory =
  | "basics"
  | "attributes"
  | "text"
  | "relationships"
  | "conditions"
  | "axes"
  | "functions"
  | "real-world"
  | "dynamic-dom"
  | "mastery";

export type ChallengeType =
  | "exact-target"
  | "multi-match"
  | "restricted"
  | "shortest-clean"
  | "relationship"
  | "reverse"
  | "broken-selector"
  | "dynamic-dom"
  | "find-the-bug"
  | "xpath-golf"
  | "speed-rush";

export type ChallengeRule =
  | { kind: "forbid-attribute"; attribute: string; reason: string }
  | { kind: "forbid-index"; reason: string }
  | { kind: "forbid-absolute-path"; reason: string }
  | { kind: "max-length"; length: number; reason: string }
  | { kind: "require-axis"; axis: string; reason: string };

export interface WebsiteTemplateRef {
  templateId: string;
  siteName: string;
}

/** Stable, hidden identifier attached to every generated DOM node for grading. Never exposed to the player. */
export type InternalNodeId = string;

export interface ReferenceSolution {
  xpath: string;
  note?: string;
}

export interface Challenge {
  id: string;
  seed: string;
  difficulty: Difficulty;
  category: ChallengeCategory;
  type: ChallengeType;
  template: WebsiteTemplateRef;

  /** Rendered HTML for the simulated website / DOM explorer. Contains data-xa-id markers. */
  html: string;

  /** Internal node ids that constitute the correct answer set. */
  targetNodeIds: InternalNodeId[];

  /** Node ids that must NOT be included for the submission to count as correct (used in ambiguity checks). */
  distractorNodeIds: InternalNodeId[];

  objective: string;
  flavor?: string;
  rules: ChallengeRule[];
  referenceSolutions: ReferenceSolution[];
  scoreConfig: ScoreConfigRef;

  timeLimitSeconds: number;
  isBoss?: boolean;

  /** For reverse-challenge type: an XPath given to the player up front. */
  givenXPath?: string;
  /** For broken-selector / find-the-bug: starting XPath the player edits. */
  seedXPath?: string;

  hints: string[];
}

export interface ScoreConfigRef {
  basePoints: number;
  maxSpeedBonus: number;
  speedWindowSeconds: number;
}
