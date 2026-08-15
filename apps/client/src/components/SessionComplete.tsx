import { motion } from "framer-motion";
import type { RoundRecord } from "../engine/usePracticeSession";
import { Button, Panel } from "../design/primitives";

interface SessionCompleteProps {
  records: RoundRecord[];
  totalScore: number;
  onReplay: () => void;
  onExit: () => void;
}

export function SessionComplete({ records, totalScore, onReplay, onExit }: SessionCompleteProps) {
  const correct = records.filter((r) => r.result.correct).length;
  const accuracy = records.length > 0 ? Math.round((correct / records.length) * 100) : 0;
  const solveTimes = records.filter((r) => r.result.correct).map((r) => r.timeTakenMs);
  const avgSolve = solveTimes.length > 0 ? Math.round(solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length / 1000) : 0;
  const bestCombo = records.length > 0 ? Math.max(...records.map((r) => r.score.comboMultiplier)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-void/95 px-6 backdrop-blur-sm"
    >
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-2 font-mono text-xs tracking-widest text-text-tertiary">
        SESSION COMPLETE
      </motion.div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-5xl font-bold text-cyan text-glow-cyan"
      >
        {totalScore.toLocaleString()}
      </motion.div>

      <Panel className="mt-8 grid w-full max-w-lg grid-cols-4 gap-px overflow-hidden bg-border-subtle">
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Rounds" value={`${correct}/${records.length}`} />
        <Stat label="Avg Solve" value={`${avgSolve}s`} />
        <Stat label="Best Combo" value={`×${bestCombo.toFixed(2).replace(/\.?0+$/, "")}`} />
      </Panel>

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={onExit}>
          Back to Practice
        </Button>
        <Button variant="primary" onClick={onReplay}>
          Play Again
        </Button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 px-4 py-4 text-center">
      <div className="text-xl font-bold text-text-primary">{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-text-tertiary">{label.toUpperCase()}</div>
    </div>
  );
}
