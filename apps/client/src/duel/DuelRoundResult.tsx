import { motion } from "framer-motion";
import type { Player, QualityTier, RoundResult } from "@xpath-arena/shared";

const TIER_META: Record<QualityTier, { label: string; className: string }> = {
  legendary: { label: "LEGENDARY", className: "text-violet text-glow-cyan" },
  excellent: { label: "EXCELLENT", className: "text-cyan text-glow-cyan" },
  clean: { label: "CLEAN", className: "text-green text-glow-green" },
  valid: { label: "VALID", className: "text-amber" },
  fragile: { label: "FRAGILE", className: "text-red text-glow-red" },
};

export function DuelRoundResult({ result, you, opponent }: { result: RoundResult; you: Player; opponent: Player | null }) {
  const mine = result.results[you.id];
  const theirs = opponent ? result.results[opponent.id] : undefined;
  const iWon = result.winnerId === you.id;
  const theyWon = !!opponent && result.winnerId === opponent.id;
  const tied = !result.winnerId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-void/95 px-6 py-10 backdrop-blur-sm"
    >
      <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-mono text-xs tracking-widest text-text-tertiary">
        ROUND {result.roundNumber}
      </motion.div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mt-1 text-3xl font-bold uppercase tracking-wide"
      >
        {tied && <span className="text-text-secondary">No Winner</span>}
        {iWon && <span className="text-green text-glow-green">You Win The Round</span>}
        {theyWon && <span className="text-red text-glow-red">{opponent?.name} Wins The Round</span>}
      </motion.div>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <PlayerResultCard name={`${you.name} (you)`} highlight={iWon} entry={mine} />
        <PlayerResultCard name={opponent?.name ?? "Opponent"} highlight={theyWon} entry={theirs} missing={!opponent} />
      </div>
    </motion.div>
  );
}

function PlayerResultCard({
  name,
  entry,
  highlight,
  missing,
}: {
  name: string;
  entry?: RoundResult["results"][string];
  highlight: boolean;
  missing?: boolean;
}) {
  if (missing || !entry) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-surface-2/60 p-5">
        <div className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">{name.toUpperCase()}</div>
        <div className="font-mono text-sm text-text-tertiary">No data</div>
      </div>
    );
  }

  const tier = TIER_META[entry.submission.quality.tier];

  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-cyan/40 bg-cyan/[0.06]" : "border-border-subtle bg-surface-2/60"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold tracking-widest text-text-tertiary">{name.toUpperCase()}</span>
        {entry.submission.correct ? (
          <span className={`font-mono text-[10px] font-bold tracking-widest ${tier.className}`}>{tier.label}</span>
        ) : (
          <span className="font-mono text-[10px] font-bold tracking-widest text-red">NO SOLVE</span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary">+{entry.score.total}</div>
      {entry.submission.correct && (
        <div className="mt-2 font-mono text-xs text-text-tertiary">{(entry.timeTakenMs / 1000).toFixed(1)}s</div>
      )}
    </div>
  );
}
