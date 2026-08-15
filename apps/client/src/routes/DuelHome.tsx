import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Panel } from "../design/primitives";
import { Logo } from "../design/Logo";
import { useMultiplayerClient } from "../multiplayer/useMultiplayerClient";

export function DuelHome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "host" | "join">("select");
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [hostAddress, setHostAddress] = useState("");

  const mp = useMultiplayerClient();

  return (
    <div className="flex h-screen w-screen flex-col overflow-y-auto bg-void px-6 py-8">
      <div className="mx-auto w-full max-w-lg flex-1">
        <div className="mb-10 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="opacity-80 transition-opacity hover:opacity-100">
            <Logo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Main Menu
          </Button>
        </div>

        {mode === "select" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
            <Panel className="px-5 py-5">
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan"
              />
            </Panel>
            <button
              onClick={() => setMode("host")}
              className="rounded-2xl border border-cyan/30 bg-cyan/[0.06] px-5 py-5 text-left transition-colors hover:bg-cyan/[0.1]"
            >
              <div className="font-mono text-sm font-bold tracking-wide text-cyan">HOST GAME</div>
              <div className="mt-1 text-xs text-text-secondary">Start a room on your local network</div>
            </button>
            <button
              onClick={() => setMode("join")}
              className="rounded-2xl border border-border-subtle bg-surface-2/60 px-5 py-5 text-left transition-colors hover:border-border-strong"
            >
              <div className="font-mono text-sm font-bold tracking-wide text-text-primary">JOIN GAME</div>
              <div className="mt-1 text-xs text-text-secondary">Enter a host address to connect</div>
            </button>
          </motion.div>
        )}

        {mode === "host" && (
          <HostPanel
            playerName={playerName || "Player"}
            mp={mp}
            onBack={() => setMode("select")}
          />
        )}

        {mode === "join" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Panel className="px-5 py-6">
              <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">JOIN GAME</h2>
              <label className="mb-1 block text-xs text-text-secondary">Host address</label>
              <input
                value={hostAddress}
                onChange={(e) => setHostAddress(e.target.value)}
                placeholder="192.168.1.24:4173"
                className="mb-4 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-cyan"
              />
              <label className="mb-1 block text-xs text-text-secondary">Room code (optional)</label>
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="X7KP"
                className="mb-4 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-text-primary outline-none focus:border-cyan"
              />
              {mp.error && <p className="mb-3 text-xs text-red">{mp.error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMode("select")}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!hostAddress || mp.status === "connecting"}
                  onClick={() => mp.join(hostAddress, playerName || "Player", roomCodeInput)}
                >
                  {mp.status === "connecting" ? "Connecting…" : "Connect"}
                </Button>
              </div>
            </Panel>
          </motion.div>
        )}

        <Panel className="mt-6 px-5 py-4">
          <p className="text-xs leading-relaxed text-text-tertiary">
            1v1 duels run over a small local server — no account and no internet connection required. Host from one
            computer, then connect from another device on the same Wi-Fi/LAN using the address shown after hosting.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function HostPanel({ playerName, mp, onBack }: { playerName: string; mp: ReturnType<typeof useMultiplayerClient>; onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Panel className="px-5 py-6">
        {mp.status === "idle" && (
          <>
            <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">HOST GAME</h2>
            <p className="mb-4 text-sm text-text-secondary">
              This starts a small local server on this machine so a second player can join over LAN.
            </p>
            {mp.error && <p className="mb-3 text-xs text-red">{mp.error}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onBack}>
                Back
              </Button>
              <Button variant="primary" onClick={() => mp.host(playerName)}>
                Create Room
              </Button>
            </div>
          </>
        )}
        {(mp.status === "connecting" || mp.status === "hosting") && (
          <>
            <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-green">ROOM READY</h2>
            <div className="mb-1 font-mono text-3xl font-bold tracking-[0.2em] text-cyan text-glow-cyan">
              {mp.roomCode ?? "····"}
            </div>
            <div className="mb-4 font-mono text-xs text-text-tertiary">{mp.hostAddress ?? "resolving address…"}</div>
            <div className="mb-4 flex items-center gap-2 font-mono text-xs text-text-secondary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" /> Waiting for opponent…
            </div>
            <Button variant="ghost" onClick={onBack}>
              Cancel
            </Button>
          </>
        )}
      </Panel>
    </motion.div>
  );
}
