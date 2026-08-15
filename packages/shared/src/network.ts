import type { Challenge, Difficulty } from "./challenge";
import type { Player } from "./player";
import type { OpponentLiveState, RoundResult } from "./match";

/** Messages sent from client -> host server. */
export type ClientMessage =
  | { type: "host-room"; playerName: string; settings: { difficulty: Difficulty; roundCount: number; roundTimerSeconds: number } }
  | { type: "join-room"; roomCode: string; playerName: string }
  | { type: "ready" }
  | { type: "live-state"; matchCount: number; status: OpponentLiveState["status"] }
  | { type: "submit"; xpath: string; timeTakenMs: number; hintsUsed: number; failedAttempts: number }
  | { type: "request-hint" }
  | { type: "rematch-vote" }
  | { type: "leave" };

/** Messages sent from host server -> clients. */
export type ServerMessage =
  | { type: "room-created"; roomCode: string; hostIp: string; port: number; you: Player }
  | { type: "room-joined"; roomCode: string; you: Player; players: Player[] }
  | { type: "player-list"; players: Player[] }
  | { type: "error"; message: string }
  | { type: "match-starting"; seed: string; countdownMs: number }
  | { type: "round-start"; roundNumber: number; totalRounds: number; challenge: Challenge; durationSeconds: number }
  | { type: "opponent-live-state"; state: OpponentLiveState }
  | { type: "round-result"; result: RoundResult }
  | { type: "match-complete"; rounds: RoundResult[] }
  | { type: "opponent-disconnected" }
  | { type: "opponent-reconnected" }
  | { type: "rematch-starting" };
