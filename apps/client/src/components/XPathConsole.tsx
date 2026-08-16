import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Challenge, EvaluationResult } from "@xpath-arena/shared";
import { XPathEditor } from "./XPathEditor";
import { Button, Kbd, Tag } from "../design/primitives";

interface XPathConsoleProps {
  challenge: Challenge;
  xpath: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  evaluation: EvaluationResult;
  isExactTarget: boolean;
  timeRemaining: number;
  comboMultiplier: number;
  comboStreak: number;
  autocompleteEnabled: boolean;
  hintLevel: number;
  onRequestHint: () => void;
  shakeToken: number;
  disabled?: boolean;
}

export function XPathConsole({
  challenge,
  xpath,
  onChange,
  onSubmit,
  evaluation,
  isExactTarget,
  timeRemaining,
  comboMultiplier,
  comboStreak,
  autocompleteEnabled,
  hintLevel,
  onRequestHint,
  shakeToken,
  disabled,
}: XPathConsoleProps) {
  const isUnlimited = !Number.isFinite(timeRemaining);
  const timePct = isUnlimited ? 100 : Math.max(0, Math.min(100, (timeRemaining / challenge.timeLimitSeconds) * 100));
  const timeUrgent = !isUnlimited && timeRemaining <= 5;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold tracking-widest text-text-tertiary">TARGET</span>
          {comboStreak >= 2 && (
            <motion.div
              key={comboStreak}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 rounded-full bg-violet/15 px-2 py-0.5 font-mono text-[11px] font-bold text-violet"
            >
              COMBO ×{comboMultiplier}
            </motion.div>
          )}
        </div>
        <p className="text-sm leading-snug text-text-primary">{challenge.objective}</p>
        {challenge.rules.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {challenge.rules.map((rule, i) => (
              <Tag key={i} tone="amber">
                {rule.reason}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-border-subtle px-4 py-2">
        <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={`h-full rounded-full ${isUnlimited ? "bg-text-tertiary/30" : timeUrgent ? "bg-red" : "bg-cyan"}`}
            animate={{ width: `${timePct}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-xs text-text-tertiary">
          <span className={timeUrgent ? "text-red font-bold" : ""}>{isUnlimited ? "∞ UNLIMITED" : `${timeRemaining.toFixed(1)}s`}</span>
          <span>{challenge.difficulty.toUpperCase()}</span>
        </div>
      </div>

      <motion.div
        animate={shakeToken > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="border-b border-border-subtle bg-void/40"
      >
        <div className="px-3 pt-2">
          <MatchStatus evaluation={evaluation} isExactTarget={isExactTarget} disabled={disabled} />
        </div>
        <XPathEditor
          value={xpath}
          onChange={onChange}
          onSubmit={onSubmit}
          onHintRequest={onRequestHint}
          autocompleteEnabled={autocompleteEnabled}
          disabled={disabled}
          placeholder="//button[@id='...']"
        />
      </motion.div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={onRequestHint}
          disabled={disabled || hintLevel >= challenge.hints.length}
          className="font-mono text-xs text-text-tertiary underline decoration-dotted underline-offset-4 hover:text-text-secondary disabled:opacity-30"
        >
          HINT ({hintLevel}/{challenge.hints.length}) <Kbd>Ctrl+H</Kbd>
        </button>
        <Button variant="primary" size="md" onClick={onSubmit} disabled={disabled || !xpath.trim()}>
          Submit <Kbd>Enter</Kbd>
        </Button>
      </div>

      <AnimatePresence>
        {hintLevel > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border-subtle px-4 py-3"
          >
            <div className="mb-1.5 font-mono text-[10px] font-semibold tracking-widest text-amber">HINT {hintLevel}</div>
            <p className="font-mono text-xs leading-relaxed text-text-secondary">{challenge.hints[hintLevel - 1]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchStatus({
  evaluation,
  isExactTarget,
  disabled,
}: {
  evaluation: EvaluationResult;
  isExactTarget: boolean;
  disabled?: boolean;
}) {
  if (disabled) return <StatusLine tone="neutral">READY</StatusLine>;

  if (!evaluation.ok) {
    return <StatusLine tone="red">{evaluation.error ?? "INVALID XPATH"}</StatusLine>;
  }

  if (isExactTarget) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <StatusLine tone="green">TARGET LOCKED</StatusLine>
      </motion.div>
    );
  }

  if (evaluation.matchCount === 0) {
    return <StatusLine tone="neutral">NO MATCHES</StatusLine>;
  }

  if (evaluation.matchCount === 1) {
    return <StatusLine tone="red">1 MATCH — WRONG TARGET</StatusLine>;
  }

  return <StatusLine tone="amber">{evaluation.matchCount} MATCHES</StatusLine>;
}

function StatusLine({ children, tone }: { children: ReactNode; tone: "neutral" | "green" | "amber" | "red" }) {
  const toneClass = {
    neutral: "text-text-tertiary",
    green: "text-green text-glow-green",
    amber: "text-amber",
    red: "text-red",
  }[tone];
  return <div className={`font-mono text-sm font-bold tracking-wide ${toneClass}`}>{children}</div>;
}
