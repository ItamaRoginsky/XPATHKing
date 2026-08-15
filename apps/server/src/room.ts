import type { WebSocket } from "ws";
import type { Difficulty, Player, RoundResult, ScoreBreakdown, ServerMessage, SubmissionResult } from "@xpath-arena/shared";
import { generateChallenge, generateRoundSeed, categoryForRound } from "@xpath-arena/challenge-engine";
import { computeRoundScore, ComboTracker } from "@xpath-arena/game-engine";
import { gradeOnServer } from "./grading";

interface PlayerConn {
  id: string;
  name: string;
  ws: WebSocket;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

interface RoundSubmission {
  submission: SubmissionResult;
  score: ScoreBreakdown;
  timeTakenMs: number;
}

const ROUND_RESULT_DISPLAY_MS = 6500;
const MATCH_START_COUNTDOWN_MS = 3000;

export class Room {
  readonly code: string;
  players: PlayerConn[] = [];
  settings: { difficulty: Difficulty; roundCount: number; roundTimerSeconds: number };

  private matchSeed: string | null = null;
  private currentRound = 0;
  private roundChallengeId: string | null = null;
  private roundDeadline = 0;
  private submissions = new Map<string, RoundSubmission>();
  private comboTrackers = new Map<string, ComboTracker>();
  private totalScores = new Map<string, number>();
  private roundResults: RoundResult[] = [];
  private roundTimer: NodeJS.Timeout | null = null;
  private advanceTimer: NodeJS.Timeout | null = null;
  private currentChallenge: ReturnType<typeof generateChallenge> | null = null;

  onEmpty: (() => void) | null = null;

  constructor(code: string, settings: { difficulty: Difficulty; roundCount: number; roundTimerSeconds: number }) {
    this.code = code;
    this.settings = settings;
  }

  addPlayer(ws: WebSocket, name: string, isHost: boolean): PlayerConn {
    const conn: PlayerConn = {
      id: `p_${Math.random().toString(36).slice(2, 10)}`,
      name: name.slice(0, 20) || "Player",
      ws,
      ready: false,
      connected: true,
      isHost,
    };
    this.players.push(conn);
    return conn;
  }

  get publicPlayers(): Player[] {
    return this.players.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost }));
  }

  broadcast(msg: ServerMessage, exceptId?: string) {
    for (const p of this.players) {
      if (p.connected && p.id !== exceptId) this.send(p, msg);
    }
  }

  send(player: PlayerConn, msg: ServerMessage) {
    if (player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(msg));
    }
  }

  private opponentOf(playerId: string): PlayerConn | undefined {
    return this.players.find((p) => p.id !== playerId);
  }

  handleReady(playerId: string) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return;
    player.ready = true;
    if (this.players.length === 2 && this.players.every((p) => p.ready) && !this.matchSeed) {
      this.startMatch();
    }
  }

  private startMatch() {
    this.matchSeed = `duel-${this.code}-${Date.now()}`;
    this.broadcast({ type: "match-starting", seed: this.matchSeed, countdownMs: MATCH_START_COUNTDOWN_MS });
    setTimeout(() => this.startRound(1), MATCH_START_COUNTDOWN_MS);
  }

  private startRound(roundNumber: number) {
    if (!this.matchSeed) return;
    this.currentRound = roundNumber;
    this.submissions.clear();

    const category = categoryForRound(roundNumber, this.settings.roundCount);
    const seed = generateRoundSeed(this.matchSeed, roundNumber);
    const challenge = generateChallenge({ seed, category, difficulty: this.settings.difficulty });
    this.currentChallenge = challenge;
    this.roundChallengeId = challenge.id;
    this.roundDeadline = Date.now() + challenge.timeLimitSeconds * 1000;

    this.broadcast({
      type: "round-start",
      roundNumber,
      totalRounds: this.settings.roundCount,
      challenge,
      durationSeconds: challenge.timeLimitSeconds,
    });

    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.roundTimer = setTimeout(() => this.finalizeRound(), challenge.timeLimitSeconds * 1000 + 50);
  }

  handleLiveState(playerId: string, matchCount: number, status: string) {
    const opponent = this.opponentOf(playerId);
    if (!opponent) return;
    this.send(opponent, {
      type: "opponent-live-state",
      state: { playerId, status: status as never, matchCount },
    });
  }

  handleSubmit(playerId: string, xpath: string, timeTakenMs: number, hintsUsed: number, failedAttempts: number) {
    if (!this.currentChallenge || this.submissions.has(playerId)) return;

    const submission = gradeOnServer(this.currentChallenge, xpath);
    if (!submission.correct) {
      // Wrong submissions don't lock the player out; let them know via a
      // lightweight live-state nudge and keep waiting for a real submit.
      const opponent = this.opponentOf(playerId);
      if (opponent) this.send(opponent, { type: "opponent-live-state", state: { playerId, status: "matches", matchCount: submission.matchedNodeIds.length } });
      return;
    }

    const isFirstSolve = ![...this.submissions.values()].some((s) => s.submission.correct);
    let tracker = this.comboTrackers.get(playerId);
    if (!tracker) {
      tracker = new ComboTracker();
      this.comboTrackers.set(playerId, tracker);
    }
    const multiplier = tracker.registerResult(true, hintsUsed);

    const score = computeRoundScore({
      correct: true,
      timeTakenMs,
      timeLimitSeconds: this.currentChallenge.timeLimitSeconds,
      qualityTier: submission.quality.tier,
      isFirstSolve,
      hintsUsed,
      failedAttempts,
      comboMultiplier: multiplier,
    });

    this.submissions.set(playerId, { submission, score, timeTakenMs });
    this.totalScores.set(playerId, (this.totalScores.get(playerId) ?? 0) + score.total);

    const opponent = this.opponentOf(playerId);
    if (opponent) this.send(opponent, { type: "opponent-live-state", state: { playerId, status: "locked-on" } });

    if (this.players.length === 2 && this.submissions.size === this.players.length) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      this.finalizeRound();
    }
  }

  private finalizeRound() {
    if (!this.currentChallenge || !this.matchSeed) return;
    const challenge = this.currentChallenge;

    // Any player who never submitted a correct answer this round gets a
    // recorded incorrect/timeout result so match stats stay honest.
    for (const p of this.players) {
      if (!this.submissions.has(p.id)) {
        let tracker = this.comboTrackers.get(p.id);
        if (!tracker) {
          tracker = new ComboTracker();
          this.comboTrackers.set(p.id, tracker);
        }
        tracker.registerResult(false, 0);
        const emptyResult: SubmissionResult = {
          correct: false,
          exactMatch: false,
          matchedNodeIds: [],
          quality: { score: 0, tier: "fragile", reasons: [], warnings: [] },
          ruleViolations: [],
        };
        const score = computeRoundScore({
          correct: false,
          timeTakenMs: challenge.timeLimitSeconds * 1000,
          timeLimitSeconds: challenge.timeLimitSeconds,
          qualityTier: "fragile",
          isFirstSolve: false,
          hintsUsed: 0,
          failedAttempts: 0,
          comboMultiplier: 1,
        });
        this.submissions.set(p.id, { submission: emptyResult, score, timeTakenMs: challenge.timeLimitSeconds * 1000 });
      }
    }

    const results: RoundResult["results"] = {};
    let winnerId: string | undefined;
    let bestScore = -1;
    for (const [playerId, r] of this.submissions.entries()) {
      results[playerId] = r;
      if (r.submission.correct && r.score.total > bestScore) {
        bestScore = r.score.total;
        winnerId = playerId;
      }
    }

    const roundResult: RoundResult = {
      roundNumber: this.currentRound,
      challengeId: challenge.id,
      results,
      winnerId,
    };
    this.roundResults.push(roundResult);
    this.broadcast({ type: "round-result", result: roundResult });

    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    if (this.currentRound >= this.settings.roundCount) {
      this.advanceTimer = setTimeout(() => {
        this.broadcast({ type: "match-complete", rounds: this.roundResults });
      }, ROUND_RESULT_DISPLAY_MS);
    } else {
      this.advanceTimer = setTimeout(() => this.startRound(this.currentRound + 1), ROUND_RESULT_DISPLAY_MS);
    }
  }

  handleDisconnect(ws: WebSocket) {
    const player = this.players.find((p) => p.ws === ws);
    if (!player) return;
    player.connected = false;
    this.broadcast({ type: "opponent-disconnected" }, player.id);

    if (this.players.every((p) => !p.connected)) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      if (this.advanceTimer) clearTimeout(this.advanceTimer);
      this.onEmpty?.();
    }
  }
}
