import dgram from "node:dgram";
import type { Room } from "./room";
import { getLanAddress } from "./lan";

export const DISCOVERY_PORT = 41730;
const BROADCAST_INTERVAL_MS = 1000;
const STALE_MS = 5000;

interface DiscoveredRoom {
  hostIp: string;
  port: number;
  lastSeen: number;
}

export interface DiscoveryService {
  /** Resolves a room code to a host address, checking locally-hosted rooms first. */
  resolve: (roomCode: string) => { hostIp: string; port: number } | null;
  close: () => Promise<void>;
}

/**
 * Lets a joiner find a host by room code alone, without typing an IP:
 * every server broadcasts its own active rooms over UDP on the LAN and
 * listens for the same broadcasts from others, so any instance can resolve
 * a code to an address for its own `/discover` endpoint.
 */
export function startDiscovery(opts: { port: number; rooms: Map<string, Room> }): DiscoveryService {
  const discovered = new Map<string, DiscoveredRoom>();
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  let ready = false;

  socket.on("error", () => {
    // LAN broadcast can be blocked by sandboxing, VPNs, or restrictive
    // firewalls — discovery just silently degrades to "code not found"
    // rather than taking the whole game server down.
  });

  socket.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg?.app === "xpath-arena" && typeof msg.roomCode === "string" && typeof msg.hostIp === "string" && typeof msg.port === "number") {
        discovered.set(msg.roomCode.toUpperCase(), { hostIp: msg.hostIp, port: msg.port, lastSeen: Date.now() });
      }
    } catch {
      // ignore malformed packets
    }
  });

  try {
    socket.bind(DISCOVERY_PORT, () => {
      try {
        socket.setBroadcast(true);
        ready = true;
      } catch {
        ready = false;
      }
    });
  } catch {
    ready = false;
  }

  const broadcastTimer = setInterval(() => {
    if (!ready || opts.rooms.size === 0) return;
    const hostIp = getLanAddress();
    for (const room of opts.rooms.values()) {
      const payload = Buffer.from(JSON.stringify({ app: "xpath-arena", roomCode: room.code, hostIp, port: opts.port }));
      socket.send(payload, 0, payload.length, DISCOVERY_PORT, "255.255.255.255", () => {
        // best-effort; a failed broadcast just means this tick's advertisement was dropped
      });
    }
  }, BROADCAST_INTERVAL_MS);
  broadcastTimer.unref?.();

  const pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of discovered) {
      if (now - entry.lastSeen > STALE_MS) discovered.delete(code);
    }
  }, STALE_MS);
  pruneTimer.unref?.();

  return {
    resolve(roomCode: string) {
      const code = roomCode.toUpperCase();
      const ownRoom = opts.rooms.get(code);
      if (ownRoom) return { hostIp: getLanAddress(), port: opts.port };

      const entry = discovered.get(code);
      if (!entry || Date.now() - entry.lastSeen > STALE_MS) return null;
      return { hostIp: entry.hostIp, port: entry.port };
    },
    close() {
      clearInterval(broadcastTimer);
      clearInterval(pruneTimer);
      return new Promise((resolve) => socket.close(() => resolve()));
    },
  };
}
