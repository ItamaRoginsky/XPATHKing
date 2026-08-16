import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Difficulty } from "@xpath-arena/shared";
import { Button, Panel, Tag } from "../design/primitives";
import { Logo } from "../design/Logo";
import { useMultiplayerClient } from "../multiplayer/useMultiplayerClient";
import { DuelLobby } from "../duel/DuelLobby";
import { DuelMatch } from "../duel/DuelMatch";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced", "expert"];
const ROUND_COUNTS = [3, 5, 7];

export function DuelHome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "host" | "join">("select");
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [hostAddress, setHostAddress] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [roundCount, setRoundCount] = useState(5);

  const mp = useMultiplayerClient();

  // Closing the tab, hitting back, or navigating elsewhere mid-connection
  // must always tear the socket down — an orphaned open connection is
  // exactly what leaves a room permanently "full" for the next joiner.
  useEffect(() => {
    return () => {
      mp.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveToSelect = () => {
    mp.disconnect();
    setMode("select");
  };

  if (mp.status === "in-match") {
    return <DuelMatch mp={mp} onExit={leaveToSelect} />;
  }

  const inLobby = (mp.status === "hosting" || mp.status === "lobby") && mp.you;

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

        {mp.status === "disconnected" && (
          <Panel className="mb-4 px-5 py-4">
            <p className="mb-3 text-sm text-red">Connection to the match was lost.</p>
            <Button variant="secondary" size="sm" onClick={leaveToSelect}>
              Back to Duel Menu
            </Button>
          </Panel>
        )}

        {inLobby && <DuelLobby mp={mp} onLeave={leaveToSelect} />}

        {!inLobby && mode === "select" && (
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

        {!inLobby && mode === "host" && (
          <HostPanel
            playerName={playerName || "Player"}
            mp={mp}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            roundCount={roundCount}
            setRoundCount={setRoundCount}
            onBack={() => {
              mp.disconnect();
              setMode("select");
            }}
          />
        )}

        {!inLobby && mode === "join" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Panel className="px-5 py-6">
              <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">JOIN GAME</h2>
              <label className="mb-1 block text-xs text-text-secondary">Host address</label>
              <input
                value={hostAddress}
                onChange={(e) => setHostAddress(e.target.value)}
                placeholder="192.168.1.24:4174"
                className="mb-4 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-cyan"
              />
              <label className="mb-1 block text-xs text-text-secondary">Room code</label>
              <input
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="X7KP"
                className="mb-4 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm uppercase text-text-primary outline-none focus:border-cyan"
              />
              {mp.error && <p className="mb-3 text-xs text-red">{mp.error}</p>}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    mp.disconnect();
                    setMode("select");
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  disabled={!hostAddress || !roomCodeInput || mp.status === "connecting"}
                  onClick={() => mp.join(hostAddress, playerName || "Player", roomCodeInput)}
                >
                  {mp.status === "connecting" ? "Connecting…" : "Connect"}
                </Button>
              </div>
            </Panel>
          </motion.div>
        )}

        {!inLobby && mode === "select" && (
          <Panel className="mt-6 px-5 py-4">
            <p className="text-xs leading-relaxed text-text-tertiary">
              1v1 duels run over a small local server — no account and no internet connection required. Host from one
              computer, then connect from another device on the same Wi-Fi/LAN using the address and room code shown
              after hosting.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}

function HostPanel({
  playerName,
  mp,
  difficulty,
  setDifficulty,
  roundCount,
  setRoundCount,
  onBack,
}: {
  playerName: string;
  mp: ReturnType<typeof useMultiplayerClient>;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  roundCount: number;
  setRoundCount: (n: number) => void;
  onBack: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Panel className="px-5 py-6">
        <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">HOST GAME</h2>
        <p className="mb-4 text-sm text-text-secondary">
          This starts a small local server on this machine so a second player can join over LAN.
        </p>

        <div className="mb-4">
          <div className="mb-1.5 text-xs text-text-secondary">Difficulty</div>
          <div className="flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button key={d} onClick={() => setDifficulty(d)}>
                <Tag tone={d === difficulty ? "cyan" : "neutral"}>{d}</Tag>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 text-xs text-text-secondary">Rounds</div>
          <div className="flex flex-wrap gap-1.5">
            {ROUND_COUNTS.map((n) => (
              <button key={n} onClick={() => setRoundCount(n)}>
                <Tag tone={n === roundCount ? "cyan" : "neutral"}>{n}</Tag>
              </button>
            ))}
          </div>
        </div>

        {mp.error && <p className="mb-3 text-xs text-red">{mp.error}</p>}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            disabled={mp.status === "connecting"}
            onClick={() => mp.host(playerName, { difficulty, roundCount, roundTimerSeconds: 30 })}
          >
            {mp.status === "connecting" ? "Creating…" : "Create Room"}
          </Button>
        </div>
      </Panel>
    </motion.div>
  );
}
