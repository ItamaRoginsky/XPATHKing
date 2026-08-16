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
    (address: string, playerName: string, roomCode: string) => {
      if (connectingRef.current || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) return;
      const trimmed = address.trim();
      const url = trimmed.startsWith("ws://") || trimmed.startsWith("wss://") ? trimmed : `ws://${trimmed}/ws`;
      connect(url, (send) => send({ type: "join-room", roomCode: roomCode.toUpperCase(), playerName }));
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
