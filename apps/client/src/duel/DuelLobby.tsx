import { motion } from "framer-motion";
import { Button, Panel } from "../design/primitives";
import type { useMultiplayerClient } from "../multiplayer/useMultiplayerClient";

interface DuelLobbyProps {
  mp: ReturnType<typeof useMultiplayerClient>;
  onLeave: () => void;
}

export function DuelLobby({ mp, onLeave }: DuelLobbyProps) {
  const you = mp.you;
  const opponent = mp.players.find((p) => p.id !== you?.id) ?? null;
  const youEntry = mp.players.find((p) => p.id === you?.id) ?? you;
  const isReady = !!youEntry?.ready;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Panel className="px-5 py-6">
        <h2 className="mb-1 font-mono text-xs font-semibold tracking-widest text-text-tertiary">DUEL LOBBY</h2>

        {you?.isHost && (
          <>
            <div className="mb-1 font-mono text-3xl font-bold tracking-[0.2em] text-cyan text-glow-cyan">{mp.roomCode ?? "····"}</div>
            <div className="mb-5 font-mono text-xs text-text-tertiary">{mp.hostAddress ?? "resolving address…"}</div>
          </>
        )}
        {!you?.isHost && <div className="mb-5 font-mono text-xs text-text-tertiary">Connected to room {mp.roomCode}</div>}

        <div className="mb-5 flex flex-col gap-2">
          <PlayerRow name={you?.name ?? "You"} suffix="(you)" ready={isReady} />
          {opponent ? (
            <PlayerRow name={opponent.name} ready={!!opponent.ready} />
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-3 font-mono text-xs text-text-tertiary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" /> Waiting for opponent to join…
            </div>
          )}
        </div>

        {opponent && !isReady && (
          <Button variant="primary" className="w-full" onClick={() => mp.send({ type: "ready" })}>
            Ready Up
          </Button>
        )}
        {opponent && isReady && !opponent.ready && (
          <div className="rounded-xl border border-border-subtle bg-surface-2/60 px-4 py-3 text-center font-mono text-xs text-text-secondary">
            Waiting for {opponent.name} to ready up…
          </div>
        )}
        {opponent && isReady && opponent.ready && (
          <div className="rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-center font-mono text-xs text-cyan">Starting…</div>
        )}

        <Button variant="ghost" className="mt-3 w-full" onClick={onLeave}>
          Leave
        </Button>
      </Panel>
    </motion.div>
  );
}

function PlayerRow({ name, ready, suffix }: { name: string; ready: boolean; suffix?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-2/60 px-4 py-3">
      <span className="font-mono text-sm text-text-primary">
        {name} {suffix && <span className="text-text-tertiary">{suffix}</span>}
      </span>
      <span
        className={`font-mono text-[10px] font-bold tracking-widest ${ready ? "text-green" : "text-text-tertiary"}`}
      >
        {ready ? "READY" : "NOT READY"}
      </span>
    </div>
  );
}
