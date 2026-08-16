import type { ChallengeCategory } from "./challenge";

export interface Player {
  id: string;
  name: string;
  isHost?: boolean;
  ready?: boolean;
}

export type Rank =
  | "DOM Rookie"
  | "Node Hunter"
  | "Selector"
  | "DOM Tracker"
  | "XPath Specialist"
  | "DOM Assassin"
  | "XPath Master"
  | "DOM Architect";

export interface CategoryMastery {
  category: ChallengeCategory;
  score: number; // 0-100
  attempts: number;
  correct: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  challengesSolved: number;
  averageSolveTimeMs: number;
  fastestSolveMs: number | null;
  accuracy: number;
  longestCombo: number;
  rating: number;
}

export interface Progression {
  chapter: number;
  level: number;
  xp: number;
}

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  stats: PlayerStats;
  progression: Progression;
  mastery: CategoryMastery[];
  achievements: Achievement[];
  settings: PlayerSettings;
}

export interface PlayerSettings {
  difficulty: "beginner" | "intermediate" | "advanced" | "expert" | "adaptive";
  roundTimerSeconds: number;
  liveHighlighting: boolean;
  autocomplete: boolean;
  reducedMotion: boolean;
  fontSize: "small" | "medium" | "large";
  masterVolume: number;
  musicVolume: number;
  fxVolume: number;
  showEvaluationDetails: boolean;
}
