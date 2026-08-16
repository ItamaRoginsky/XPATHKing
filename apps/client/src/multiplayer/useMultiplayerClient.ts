import { useCallback, useRef, useState } from "react";
import type { ClientMessage, Player, ServerMessage } from "@xpath-arena/shared";

export type MultiplayerStatus = "idle" | "connecting" | "hosting" | "lobby" | "in-match" | "error" | "disconnected";

function resolveDefaultWsUrl(): string {
  const { hostname, protocol } = window.location;
  // Vite's dev server (any port — 5173, 5174, ... if 5173 was taken) always
  // proxies nothing for WS, so the game server is a separate process on
  // 4174 whenever this is a dev build. In a production/LAN build the game
  // server serves the client itself, so the WS endpoint is same-origin.
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  if (import.meta.env.DEV) return `${wsProtocol}//${hostname}:4174/ws`;
  return `${wsProtocol}//${window.location.host}/ws`;
}

// Mirrors resolveDefaultWsUrl but for the plain HTTP `/discover` lookup —
// every game server instance (this one included, if it's also hosting)
// listens for LAN room-code broadcasts, so this is always "my own local
// server" regardless of which machine ends up hosting the match.
function resolveDiscoveryHttpBase(): string {
  const { hostname, protocol } = window.location;
  if (import.meta.env.DEV) return `${protocol}//${hostname}:4174`;
  return `${protocol}//${window.location.host}`;
}

interface DiscoverResponse {
  found: boolean;
  hostIp?: string;
  port?: number;
}

const DISCOVERY_MAX_ATTEMPTS = 6;
const DISCOVERY_RETRY_MS = 1000;

interface MultiplayerState {
  status: MultiplayerStatus;
  roomCode: string | null;
  hostAddress: string | null;
  error: string | null;
  players: Player[];
  you: Player | null;
  lastMessage: ServerMessage | null;
}

const IDLE_STATE: MultiplayerState = {
  status: "idle",
  roomCode: null,
  hostAddress: null,
  error: null,
  players: [],
  you: null,
  lastMessage: null,
};

export function useMultiplayerClient() {
  const [state, setState] = useState<MultiplayerState>(IDLE_STATE);
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: ServerMessage) => void>>(new Set());
  // Connection lifecycle isn't just a function of `status` — a click can
  // fire before the state update from a prior click has committed, so a
  // plain ref guard (checked synchronously) is what actually prevents a
  // second socket/second host-room from ever being created.
  const connectingRef = useRef(false);
  // Bumped on every disconnect/new join attempt so an in-flight discovery
  // retry loop from a since-abandoned join can recognize it's stale and
  // stop touching state instead of clobbering whatever came after it.
  const joinGenerationRef = useRef(0);

  const connect = useCallback((url: string, onOpen: (send: (msg: ClientMessage) => void) => void) => {
    if (connectingRef.current) return;
    connectingRef.current = true;

    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setState((s) => ({ ...IDLE_STATE, status: "connecting", players: s.players }));

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      connectingRef.current = false;
      setState((s) => ({ ...s, status: "error", error: "Could not reach that address." }));
      return;
    }
    socketRef.current = socket;

    const send = (msg: ClientMessage) => socket.send(JSON.stringify(msg));

    socket.onopen = () => onOpen(send);

    socket.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      setState((s) => ({ ...s, lastMessage: msg }));
      listenersRef.current.forEach((fn) => fn(msg));

      if (msg.type === "room-created") {
        connectingRef.current = false;
        setState((s) => ({ ...s, status: "hosting", roomCode: msg.roomCode, hostAddress: `${msg.hostIp}:${msg.port}`, you: msg.you, players: [msg.you] }));
      } else if (msg.type === "room-joined") {
        connectingRef.current = false;
        setState((s) => ({ ...s, status: "lobby", roomCode: msg.roomCode, you: msg.you, players: msg.players }));
      } else if (msg.type === "player-list") {
        setState((s) => ({ ...s, players: msg.players }));
      } else if (msg.type === "error") {
        connectingRef.current = false;
        setState((s) => ({ ...s, status: "error", error: msg.message }));
      } else if (msg.type === "match-starting") {
        setState((s) => ({ ...s, status: "in-match" }));
      }
    };

    socket.onerror = () => {
      connectingRef.current = false;
      setState((s) => ({ ...s, status: "error", error: "Connection failed. Check the address and try again." }));
    };

    socket.onclose = () => {
      connectingRef.current = false;
      socketRef.current = null;
      setState((s) => (s.status === "in-match" || s.status === "lobby" || s.status === "hosting" ? { ...s, status: "disconnected" } : s));
    };
  }, []);

  const host = useCallback(
    (playerName: string, settings?: { difficulty?: "beginner" | "intermediate" | "advanced" | "expert"; roundCount?: number; roundTimerSeconds?: number }) => {
      if (connectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) return;
      connect(resolveDefaultWsUrl(), (send) =>
        send({
          type: "host-room",
          playerName,
          settings: {
            difficulty: settings?.difficulty ?? "intermediate",
            roundCount: settings?.roundCount ?? 5,
            roundTimerSeconds: settings?.roundTimerSeconds ?? 30,
          },
        }),
      );
    },
    [connect],
  );

  const join = useCallback(
    (playerName: string, roomCode: string) => {
      if (connectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) return;
      const code = roomCode.trim().toUpperCase();
      if (!code) return;

      connectingRef.current = true;
      const generation = ++joinGenerationRef.current;
      setState((s) => ({ ...IDLE_STATE, status: "connecting", players: s.players }));

      const attempt = async (attemptNumber: number) => {
        if (generation !== joinGenerationRef.current) return; // superseded by a disconnect or a newer join

        let result: DiscoverResponse | null = null;
        try {
          const resp = await fetch(`${resolveDiscoveryHttpBase()}/discover?code=${encodeURIComponent(code)}`);
          result = (await resp.json()) as DiscoverResponse;
        } catch {
          // LAN hiccup while searching — treated the same as "not found yet", just retry
        }

        if (generation !== joinGenerationRef.current) return;

        if (result?.found && result.hostIp && result.port) {
          connectingRef.current = false; // let connect() re-arm its own guard
          connect(`ws://${result.hostIp}:${result.port}/ws`, (send) => send({ type: "join-room", roomCode: code, playerName }));
          return;
        }

        if (attemptNumber >= DISCOVERY_MAX_ATTEMPTS) {
          connectingRef.current = false;
          setState((s) => ({
            ...s,
            status: "error",
            error: "Couldn't find that room on this network. Double-check the code with your opponent and make sure you're both on the same Wi-Fi/LAN.",
          }));
          return;
        }

        setTimeout(() => attempt(attemptNumber + 1), DISCOVERY_RETRY_MS);
      };

      attempt(1);
    },
    [connect],
  );

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(msg));
  }, []);

  const subscribe = useCallback((fn: (msg: ServerMessage) => void) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    joinGenerationRef.current += 1;
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: "leave" } satisfies ClientMessage));
        } catch {
          // socket already going away — nothing to clean up server-side, it'll notice the close
        }
      }
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    setState(IDLE_STATE);
  }, []);

  return { ...state, host, join, send, subscribe, disconnect };
}
