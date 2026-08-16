// @vitest-environment node
//
// Deliberately run under vitest's plain "node" environment, not the
// project-wide "jsdom" one. The multiplayer server runs as a bare Node.js
// process in production (started via `tsx src/index.ts`), and grading goes
// through a standalone `new JSDOM(...)` instance with no globals injected —
// running this suite under vitest's jsdom environment would silently paper
// over exactly the class of bug this integration test exists to catch (see
// packages/game-engine/src/server-environment.test.ts for the unit-level
// version of that regression).

import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { ClientMessage, ServerMessage, Challenge } from "@xpath-arena/shared";
import { createGameServer, type GameServerHandle } from "./server";

let server: GameServerHandle | null = null;

afterEach(async () => {
  if (server) {
    await server.close();
    server = null;
  }
});

function connect(port: number): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

function send(ws: WebSocket, msg: ClientMessage) {
  ws.send(JSON.stringify(msg));
}

function nextMessageOfType<T extends ServerMessage["type"]>(
  ws: WebSocket,
  type: T,
  timeoutMs = 5000,
): Promise<Extract<ServerMessage, { type: T }>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${type}"`)), timeoutMs);
    const handler = (raw: WebSocket.RawData) => {
      const msg = JSON.parse(raw.toString()) as ServerMessage;
      if (msg.type === type) {
        clearTimeout(timer);
        ws.off("message", handler);
        resolve(msg as Extract<ServerMessage, { type: T }>);
      }
    };
    ws.on("message", handler);
  });
}

function collectAll(ws: WebSocket, sink: ServerMessage[]) {
  ws.on("message", (raw) => sink.push(JSON.parse(raw.toString())));
}

describe("1v1 duel over the real WebSocket protocol", () => {
  it("synchronizes identical challenges, grades authoritatively, and completes a match", async () => {
    // Two full rounds, each holding on the result screen for ~6.5s before
    // advancing — comfortably needs more than vitest's 5s default.
    server = await createGameServer({ port: 0 });

    const hostWs = await connect(server.port);
    const joinWs = await connect(server.port);

    const hostMessages: ServerMessage[] = [];
    const joinMessages: ServerMessage[] = [];
    collectAll(hostWs, hostMessages);
    collectAll(joinWs, joinMessages);

    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 2, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");
    expect(roomCreated.roomCode).toMatch(/^[A-Z0-9]{4}$/);

    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    const roomJoined = await nextMessageOfType(joinWs, "room-joined");
    expect(roomJoined.players).toHaveLength(2);

    send(hostWs, { type: "ready" });
    send(joinWs, { type: "ready" });

    await nextMessageOfType(hostWs, "match-starting");

    // Both clients race to answer each round correctly with the server's
    // own reference solution — this exercises real grading, not a mock.
    const answerRounds = async (ws: WebSocket, delayMs: number, rounds: Challenge[]) => {
      for (let i = 0; i < 2; i++) {
        // The server holds each round-result on screen for ~6.5s before
        // advancing, so the gap between successive round-starts is long.
        const roundStart = await nextMessageOfType(ws, "round-start", 12000);
        rounds.push(roundStart.challenge);
        const xpath = roundStart.challenge.referenceSolutions[0]!.xpath;
        await new Promise((r) => setTimeout(r, delayMs));
        send(ws, { type: "submit", xpath, timeTakenMs: delayMs, hintsUsed: 0, failedAttempts: 0 });
      }
    };

    const hostChallenges: Challenge[] = [];
    const joinChallenges: Challenge[] = [];

    const [, , matchComplete] = await Promise.all([
      answerRounds(hostWs, 50, hostChallenges),
      answerRounds(joinWs, 150, joinChallenges),
      nextMessageOfType(hostWs, "match-complete", 20000),
    ]);

    expect(matchComplete.rounds).toHaveLength(2);
    expect(hostChallenges.map((c) => c.html)).toEqual(joinChallenges.map((c) => c.html));

    for (const round of matchComplete.rounds) {
      const results = Object.values(round.results);
      expect(results).toHaveLength(2);
      for (const r of results) {
        expect(r.submission.correct).toBe(true);
      }
    }

    // Host answered every round faster, so should out-score the joiner and
    // win every round via the speed bonus.
    for (const round of matchComplete.rounds) {
      expect(round.winnerId).toBe(roomCreated.you.id);
    }

    hostWs.close();
    joinWs.close();
  }, 25000);

  it("relays an opponent-disconnected notice when a player drops mid-match", async () => {
    server = await createGameServer({ port: 0 });

    const hostWs = await connect(server.port);
    const joinWs = await connect(server.port);

    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 1, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");

    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    await nextMessageOfType(joinWs, "room-joined");

    send(hostWs, { type: "ready" });
    send(joinWs, { type: "ready" });
    await nextMessageOfType(hostWs, "round-start");

    const disconnectNotice = nextMessageOfType(hostWs, "opponent-disconnected");
    joinWs.close();

    await expect(disconnectNotice).resolves.toMatchObject({ type: "opponent-disconnected" });

    hostWs.close();
  });

  it("frees a room slot when a player disconnects before the match starts, and does not report full with only one connected player", async () => {
    server = await createGameServer({ port: 0 });

    const hostWs = await connect(server.port);
    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 1, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");

    // First joiner connects, then leaves before a match ever starts.
    const flakyWs = await connect(server.port);
    send(flakyWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Flaky" });
    await nextMessageOfType(flakyWs, "room-joined");
    flakyWs.close();
    await new Promise((r) => setTimeout(r, 100));

    // A real second player should be able to take the now-empty slot —
    // this is the exact "room already full" false-positive scenario.
    const joinWs = await connect(server.port);
    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    const roomJoined = await nextMessageOfType(joinWs, "room-joined");
    expect(roomJoined.players.filter((p) => p.name === "Bravo")).toHaveLength(1);

    hostWs.close();
    joinWs.close();
  });

  it("supports a rematch after match-complete, replaying a fresh match in the same room", async () => {
    server = await createGameServer({ port: 0 });

    const hostWs = await connect(server.port);
    const joinWs = await connect(server.port);

    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 1, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");
    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    await nextMessageOfType(joinWs, "room-joined");

    send(hostWs, { type: "ready" });
    send(joinWs, { type: "ready" });

    const firstRound = await nextMessageOfType(hostWs, "round-start", 12000);
    const xpath = firstRound.challenge.referenceSolutions[0]!.xpath;
    send(hostWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });
    send(joinWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });

    await nextMessageOfType(hostWs, "match-complete", 12000);

    send(hostWs, { type: "rematch-vote" });
    send(joinWs, { type: "rematch-vote" });

    await nextMessageOfType(hostWs, "rematch-starting");
    const secondRound = await nextMessageOfType(hostWs, "round-start", 12000);
    expect(secondRound.roundNumber).toBe(1);

    hostWs.close();
    joinWs.close();
  }, 20000);

  it("rejects joining a room that does not exist", async () => {
    server = await createGameServer({ port: 0 });
    const ws = await connect(server.port);

    send(ws, { type: "join-room", roomCode: "ZZZZ", playerName: "Ghost" });
    const error = await nextMessageOfType(ws, "error");
    expect(error.message).toMatch(/not found/i);

    ws.close();
  });

  it("ignores a duplicate correct submit from the same player — no double score", async () => {
    server = await createGameServer({ port: 0 });
    const hostWs = await connect(server.port);
    const joinWs = await connect(server.port);

    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 1, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");
    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    await nextMessageOfType(joinWs, "room-joined");

    send(hostWs, { type: "ready" });
    send(joinWs, { type: "ready" });

    const roundStart = await nextMessageOfType(hostWs, "round-start", 12000);
    const xpath = roundStart.challenge.referenceSolutions[0]!.xpath;

    // Same player "double-clicks" submit: two correct submissions for the
    // same round, back to back, before the opponent answers at all.
    send(hostWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });
    send(hostWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });
    send(hostWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });

    // Opponent times out (no submit) so the round finalizes on the timer;
    // roundTimerSeconds is 20s in this room, so use a short-timer room
    // instead — resend with join's own (also correct) submit to finalize
    // quickly and inspect the host's recorded result.
    send(joinWs, { type: "submit", xpath, timeTakenMs: 5000, hintsUsed: 0, failedAttempts: 0 });

    const roundResult = await nextMessageOfType(hostWs, "round-result", 12000);
    const hostResult = roundResult.result.results[roomCreated.you.id]!;
    expect(hostResult.submission.correct).toBe(true);
    // A single correct, fast, first solve at beginner difficulty: base
    // 1000 + speed bonus + quality + first-solve bonus. If the duplicate
    // submits were double-scored this would come out roughly 2-3x higher.
    expect(hostResult.score.total).toBeLessThan(1000 + 350 + 350 + 100 + 1);

    hostWs.close();
    joinWs.close();
  }, 20000);

  it("awards the first-solve bonus to exactly one player when both submit back to back", async () => {
    server = await createGameServer({ port: 0 });
    const hostWs = await connect(server.port);
    const joinWs = await connect(server.port);

    send(hostWs, {
      type: "host-room",
      playerName: "Alpha",
      settings: { difficulty: "beginner", roundCount: 1, roundTimerSeconds: 20 },
    });
    const roomCreated = await nextMessageOfType(hostWs, "room-created");
    send(joinWs, { type: "join-room", roomCode: roomCreated.roomCode, playerName: "Bravo" });
    const roomJoined = await nextMessageOfType(joinWs, "room-joined");

    send(hostWs, { type: "ready" });
    send(joinWs, { type: "ready" });

    const roundStart = await nextMessageOfType(hostWs, "round-start", 12000);
    const xpath = roundStart.challenge.referenceSolutions[0]!.xpath;

    // Fire both submits with no artificial delay between them — as close
    // to "simultaneous" as two separate sockets can get.
    send(hostWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });
    send(joinWs, { type: "submit", xpath, timeTakenMs: 100, hintsUsed: 0, failedAttempts: 0 });

    const roundResult = await nextMessageOfType(hostWs, "round-result", 12000);
    const hostResult = roundResult.result.results[roomCreated.you.id]!;
    const joinResult = roundResult.result.results[roomJoined.you.id]!;

    expect(hostResult.submission.correct).toBe(true);
    expect(joinResult.submission.correct).toBe(true);

    const firstSolveBonuses = [hostResult.score.firstSolve, joinResult.score.firstSolve];
    // Exactly one player gets the first-solve bonus — never both, never
    // neither — regardless of near-simultaneous arrival.
    expect(firstSolveBonuses.filter((b) => b > 0)).toHaveLength(1);
    expect(firstSolveBonuses.filter((b) => b === 0)).toHaveLength(1);

    hostWs.close();
    joinWs.close();
  }, 20000);
});
