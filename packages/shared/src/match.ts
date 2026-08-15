import type { Challenge, Difficulty } from "./challenge";
import type { Player } from "./player";
import type { ScoreBreakdown, SubmissionResult } from "./scoring";

export type OpponentStatus =
  | "idle"
  | "searching"
  | "matches"
  | "locked-on"
  | "submitted"
  | "failed";

export interface OpponentLiveState {
  playerId: string;
  status: OpponentStatus;
  matchCount?: number;
}

export interface MatchSettings {
  difficulty: Difficulty;
  roundCount: number;
  roundTimerSeconds: number;
  seed: string;
}

export interface RoundResult {
  roundNumber: number;
  challengeId: string;
  results: Record<string, { submission: SubmissionResult; score: ScoreBreakdown; timeTakenMs: number }>;
  winnerId?: string;
}

export interface Round {
  roundNumber: number;
  challenge: Challenge;
  startedAt: number;
  durationSeconds: number;
}

export interface Match {
  id: string;
  roomCode: string;
  players: Player[];
  settings: MatchSettings;
  rounds: RoundResult[];
  currentRound: number;
  status: "lobby" | "intro" | "in-progress" | "round-result" | "complete";
}
