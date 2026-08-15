import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, type WebSocket } from "ws";
import type { ClientMessage } from "@xpath-arena/shared";
import { Room } from "./room";
import { generateRoomCode } from "./room-code";
import { getLanAddress } from "./lan";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CLIENT_DIST = path.resolve(__dirname, "../../client/dist");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

export interface GameServerHandle {
  httpServer: Server;
  port: number;
  lanAddress: string;
  rooms: Map<string, Room>;
  close: () => Promise<void>;
}

/**
 * Boots the authoritative game server: static client hosting (when a build
 * exists) plus the WebSocket lobby/match protocol, on one HTTP server so a
 * LAN peer only ever needs one address. Exported as a factory (rather than
 * started as an import side effect) so tests can spin up isolated instances
 * on ephemeral ports.
 */
export function createGameServer(opts: { port?: number; clientDist?: string } = {}): Promise<GameServerHandle> {
  const clientDist = opts.clientDist ?? DEFAULT_CLIENT_DIST;

  const httpServer = createServer(async (req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }

    if (!existsSync(clientDist)) {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(
        "XPath Arena game server is running. Build the client (npm run build) to serve it from here, or run the client dev server separately.",
      );
      return;
    }

    const urlPath = (req.url ?? "/").split("?")[0]!;
    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const filePath = path.join(clientDist, relative);
    const safe = filePath.startsWith(clientDist);
    const target = safe && existsSync(filePath) ? filePath : path.join(clientDist, "index.html");

    try {
      const data = await readFile(target);
      const ext = path.extname(target);
      res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const rooms = new Map<string, Room>();
  const socketRoom = new Map<WebSocket, { room: Room; playerId: string }>();

  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const existing = socketRoom.get(ws);

      if (msg.type === "host-room") {
        const code = generateRoomCode(new Set(rooms.keys()));
        const room = new Room(code, msg.settings);
        room.onEmpty = () => rooms.delete(code);
        rooms.set(code, room);
        const player = room.addPlayer(ws, msg.playerName, true);
        socketRoom.set(ws, { room, playerId: player.id });
        room.send(player, {
          type: "room-created",
          roomCode: code,
          hostIp: getLanAddress(),
          port: (httpServer.address() as { port: number }).port,
          you: { id: player.id, name: player.name, isHost: true },
        });
        return;
      }

      if (msg.type === "join-room") {
        const room = rooms.get(msg.roomCode.toUpperCase());
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found. Check the code and try again." }));
          return;
        }
        if (room.players.filter((p) => p.connected).length >= 2) {
          ws.send(JSON.stringify({ type: "error", message: "That room is already full." }));
          return;
        }
        const player = room.addPlayer(ws, msg.playerName, false);
        socketRoom.set(ws, { room, playerId: player.id });
        room.send(player, {
          type: "room-joined",
          roomCode: room.code,
          you: { id: player.id, name: player.name, isHost: false },
          players: room.publicPlayers,
        });
        room.broadcast({ type: "player-list", players: room.publicPlayers });
        return;
      }

      if (!existing) return;
      const { room, playerId } = existing;

      switch (msg.type) {
        case "ready":
          room.handleReady(playerId);
          break;
        case "live-state":
          room.handleLiveState(playerId, msg.matchCount, msg.status);
          break;
        case "submit":
          room.handleSubmit(playerId, msg.xpath, msg.timeTakenMs, msg.hintsUsed, msg.failedAttempts);
          break;
        case "leave":
          room.handleDisconnect(ws);
          socketRoom.delete(ws);
          break;
        default:
          break;
      }
    });

    ws.on("close", () => {
      const existing = socketRoom.get(ws);
      if (existing) {
        existing.room.handleDisconnect(ws);
        socketRoom.delete(ws);
      }
    });
  });

  return new Promise((resolve) => {
    httpServer.listen(opts.port ?? 4174, () => {
      const port = (httpServer.address() as { port: number }).port;
      resolve({
        httpServer,
        port,
        lanAddress: getLanAddress(),
        rooms,
        close: () =>
          new Promise((res) => {
            wss.close();
            httpServer.close(() => res());
          }),
      });
    });
  });
}
