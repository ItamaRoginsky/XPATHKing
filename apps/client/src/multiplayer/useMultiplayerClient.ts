import { useCallback, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "@xpath-arena/shared";

export type MultiplayerStatus = "idle" | "connecting" | "hosting" | "lobby" | "in-match" | "error" | "disconnected";

function resolveDefaultWsUrl(): string {
  const { hostname, port } = window.location;
  // Vite dev serves the client on 5173; the game server is a separate
  // process on 4174. In a production/LAN build the server serves the
  // client itself, so the WS endpoint is same-origin.
  if (port === "5173") return `ws://${hostname}:4174/ws`;
  return `ws://${window.location.host}/ws`;
}

interface MultiplayerState {
  status: MultiplayerStatus;
  roomCode: string | null;
  hostAddress: string | null;
  error: string | null;
  players: { id: string; name: string }[];
  lastMessage: ServerMessage | null;
}

export function useMultiplayerClient() {
  const [state, setState] = useState<MultiplayerState>({
    status: "idle",
    roomCode: null,
    hostAddress: null,
    error: null,
    players: [],
    lastMessage: null,
  });
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: ServerMessage) => void>>(new Set());

  const connect = useCallback((url: string, onOpen: (send: (msg: ClientMessage) => void) => void) => {
    setState((s) => ({ ...s, status: "connecting", error: null }));

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
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
        setState((s) => ({ ...s, status: "hosting", roomCode: msg.roomCode, hostAddress: `${msg.hostIp}:${msg.port}` }));
      } else if (msg.type === "room-joined") {
        setState((s) => ({ ...s, status: "lobby", roomCode: msg.roomCode, players: msg.players }));
      } else if (msg.type === "player-list") {
        setState((s) => ({ ...s, players: msg.players }));
      } else if (msg.type === "error") {
        setState((s) => ({ ...s, status: "error", error: msg.message }));
      } else if (msg.type === "match-starting") {
        setState((s) => ({ ...s, status: "in-match" }));
      }
    };

    socket.onerror = () => {
      setState((s) => ({ ...s, status: "error", error: "Connection failed. Check the address and try again." }));
    };

    socket.onclose = () => {
      setState((s) => (s.status === "in-match" ? { ...s, status: "disconnected" } : s));
    };
  }, []);

  const host = useCallback(
    (playerName: string) => {
      connect(resolveDefaultWsUrl(), (send) => send({ type: "host-room", playerName, settings: { difficulty: "intermediate", roundCount: 5, roundTimerSeconds: 30 } }));
    },
    [connect],
  );

  const join = useCallback(
    (address: string, playerName: string, roomCode: string) => {
      const trimmed = address.trim();
      const url = trimmed.startsWith("ws://") || trimmed.startsWith("wss://") ? trimmed : `ws://${trimmed}/ws`;
      connect(url, (send) => send({ type: "join-room", roomCode: roomCode.toUpperCase(), playerName }));
    },
    [connect],
  );

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const subscribe = useCallback((fn: (msg: ServerMessage) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setState({ status: "idle", roomCode: null, hostAddress: null, error: null, players: [], lastMessage: null });
  }, []);

  return { ...state, host, join, send, subscribe, disconnect };
}
