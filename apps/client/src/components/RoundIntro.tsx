import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Challenge } from "@xpath-arena/shared";
import { chapterFor } from "@xpath-arena/challenge-engine";

interface RoundIntroProps {
  challenge: Challenge;
  roundNumber: number;
  totalRounds: number;
  onStart: () => void;
}

export function RoundIntro({ challenge, roundNumber, totalRounds, onStart }: RoundIntroProps) {
  const chapter = chapterFor(challenge.category);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center bg-void/95 backdrop-blur-sm"
      onClick={onStart}
    >
      {challenge.isBoss && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 rounded-full border border-red/40 bg-red/10 px-4 py-1 font-mono text-xs font-bold tracking-widest text-red"
        >
          ⚠ BOSS DOM
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="font-mono text-sm tracking-widest text-text-tertiary"
      >
        ROUND {roundNumber} / {totalRounds}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-2 text-3xl font-bold uppercase tracking-wide text-cyan text-glow-cyan"
      >
        {chapter.title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 max-w-lg text-center"
      >
        <div className="mb-2 font-mono text-xs font-semibold tracking-widest text-text-tertiary">TARGET</div>
        <p className="text-xl leading-snug text-text-primary">{challenge.objective}</p>
        {challenge.flavor && <p className="mt-3 text-sm italic text-text-tertiary">{challenge.flavor}</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 font-mono text-xs text-text-tertiary"
      >
        Press <span className="text-text-secondary">Enter</span> or click to begin
      </motion.div>
    </motion.div>
  );
}
