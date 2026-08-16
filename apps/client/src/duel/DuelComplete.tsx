import { motion } from "framer-motion";
import type { Player, RoundResult } from "@xpath-arena/shared";
import { Button, Panel } from "../design/primitives";

export function DuelComplete({
  rounds,
  you,
  opponent,
  onRematch,
  onExit,
}: {
  rounds: RoundResult[];
  you: Player;
  opponent: Player | null;
  onRematch: () => void;
  onExit: () => void;
}) {
  const myTotal = rounds.reduce((sum, r) => sum + (r.results[you.id]?.score.total ?? 0), 0);
  const theirTotal = opponent ? rounds.reduce((sum, r) => sum + (r.results[opponent.id]?.score.total ?? 0), 0) : 0;
  const myWins = rounds.filter((r) => r.winnerId === you.id).length;
  const theirWins = opponent ? rounds.filter((r) => r.winnerId === opponent.id).length : 0;

  const iWon = myTotal > theirTotal;
  const tied = myTotal === theirTotal;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/95 px-6 backdrop-blur-sm"
    >
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-2 font-mono text-xs tracking-widest text-text-tertiary">
        MATCH COMPLETE
      </motion.div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className={`text-4xl font-bold uppercase tracking-wide ${tied ? "text-text-secondary" : iWon ? "text-green text-glow-green" : "text-red text-glow-red"}`}
      >
        {tied ? "Draw" : iWon ? "Victory" : "Defeat"}
      </motion.div>

      <Panel className="mt-8 grid w-full max-w-md grid-cols-2 gap-px overflow-hidden bg-border-subtle">
        <Stat label={`${you.name} (you)`} value={myTotal.toLocaleString()} sub={`${myWins} rounds won`} highlight={iWon && !tied} />
        <Stat label={opponent?.name ?? "Opponent"} value={theirTotal.toLocaleString()} sub={`${theirWins} rounds won`} highlight={!iWon && !tied} />
      </Panel>

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={onExit}>
          Back to Menu
        </Button>
        <Button variant="primary" onClick={onRematch}>
          Rematch
        </Button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight: boolean }) {
  return (
    <div className={`px-4 py-4 text-center ${highlight ? "bg-cyan/[0.08]" : "bg-surface-2"}`}>
      <div className={`text-2xl font-bold ${highlight ? "text-cyan" : "text-text-primary"}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-text-tertiary">{label.toUpperCase()}</div>
      <div className="mt-0.5 font-mono text-[10px] text-text-tertiary">{sub}</div>
    </div>
  );
}
