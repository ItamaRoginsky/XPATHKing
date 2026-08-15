import { useEffect } from "react";
import { motion } from "framer-motion";
import type { QualityTier } from "@xpath-arena/shared";
import type { RoundRecord } from "../engine/usePracticeSession";
import { Button, Kbd } from "../design/primitives";

const TIER_META: Record<QualityTier, { label: string; className: string }> = {
  legendary: { label: "LEGENDARY", className: "text-violet text-glow-cyan" },
  excellent: { label: "EXCELLENT", className: "text-cyan text-glow-cyan" },
  clean: { label: "CLEAN", className: "text-green text-glow-green" },
  valid: { label: "VALID", className: "text-amber" },
  fragile: { label: "FRAGILE", className: "text-red text-glow-red" },
};

export function RoundResult({ record, onContinue, isLastRound }: { record: RoundRecord; onContinue: () => void; isLastRound: boolean }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onContinue]);

  const { result, score, timedOut, challenge } = record;
  const tier = TIER_META[result.quality.tier];
  const strongerOption = challenge.referenceSolutions[0]?.xpath;
  const showStrongerOption =
    result.correct && (result.quality.tier === "valid" || result.quality.tier === "fragile") && strongerOption && strongerOption !== record.xpath;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center overflow-y-auto bg-void/95 px-6 py-10 backdrop-blur-sm"
      onClick={onContinue}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="text-center"
      >
        {result.correct ? (
          <div className="text-3xl font-bold uppercase tracking-wide text-green text-glow-green">Target Locked</div>
        ) : timedOut ? (
          <div className="text-3xl font-bold uppercase tracking-wide text-red text-glow-red">Time's Up</div>
        ) : (
          <div className="text-3xl font-bold uppercase tracking-wide text-red text-glow-red">Round Failed</div>
        )}
      </motion.div>

      {result.correct && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 flex flex-col items-center gap-1.5 font-mono text-sm"
        >
          <ScoreLine label="CORRECT" value={score.base} delay={0.2} />
          {score.speed > 0 && <ScoreLine label="SPEED" value={score.speed} delay={0.28} />}
          {score.quality > 0 && <ScoreLine label={`${tier.label} XPATH`} value={score.quality} delay={0.36} />}
          {score.firstSolve > 0 && <ScoreLine label="FIRST SOLVE" value={score.firstSolve} delay={0.44} />}
          {score.comboMultiplier > 1 && (
            <div className="mt-1 text-violet">×{score.comboMultiplier.toFixed(2)} combo multiplier</div>
          )}
          {score.hintPenalty > 0 && <ScoreLine label="HINTS USED" value={-score.hintPenalty} delay={0.5} negative />}
          {score.failPenalty > 0 && <ScoreLine label="FAILED ATTEMPTS" value={-score.failPenalty} delay={0.55} negative />}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, type: "spring" }}
            className="mt-2 text-2xl font-bold text-text-primary"
          >
            +{score.total}
          </motion.div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 w-full max-w-lg rounded-2xl border border-border-subtle bg-surface-2/70 p-5 text-left"
      >
        {result.correct && (
          <div className="mb-3 flex items-center gap-2">
            <span className={`font-mono text-xs font-bold tracking-widest ${tier.className}`}>{tier.label} XPATH</span>
          </div>
        )}
        <div className="mb-3 rounded-lg bg-void/50 px-3 py-2 font-mono text-xs text-text-secondary">
          <div className="mb-1 text-text-tertiary">YOUR XPATH</div>
          <div className="text-text-primary">{record.xpath || "(empty)"}</div>
        </div>

        {result.quality.reasons.length > 0 && (
          <ul className="mb-2 space-y-1">
            {result.quality.reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="text-green">✓</span> {r}
              </li>
            ))}
          </ul>
        )}
        {result.quality.warnings.length > 0 && (
          <ul className="space-y-1">
            {result.quality.warnings.map((w, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-amber">
                <span>△</span> {w}
              </li>
            ))}
          </ul>
        )}
        {result.ruleViolations.length > 0 && (
          <ul className="space-y-1">
            {result.ruleViolations.map((w, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-red">
                <span>✕</span> {w}
              </li>
            ))}
          </ul>
        )}

        {(showStrongerOption || !result.correct) && strongerOption && (
          <div className="mt-4 border-t border-border-subtle pt-3">
            <div className="mb-1 font-mono text-[10px] font-bold tracking-widest text-cyan">
              {result.correct ? "A STRONGER OPTION" : "REFERENCE SOLUTION"}
            </div>
            <div className="rounded-lg bg-void/50 px-3 py-2 font-mono text-xs text-cyan">{strongerOption}</div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8">
        <Button variant="primary" onClick={onContinue}>
          {isLastRound ? "See Results" : "Continue"} <Kbd>Enter</Kbd>
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ScoreLine({ label, value, delay, negative = false }: { label: string; value: number; delay: number; negative?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex w-48 items-center justify-between"
    >
      <span className="text-text-tertiary">{label}</span>
      <span className={negative ? "text-red" : "text-green"}>
        {negative ? "" : "+"}
        {value}
      </span>
    </motion.div>
  );
}
