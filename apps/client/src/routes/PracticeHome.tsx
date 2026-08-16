import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CHAPTERS } from "@xpath-arena/challenge-engine";
import { useProfileStore } from "../state/profile-store";
import { Button, Panel, Tag } from "../design/primitives";
import { Logo } from "../design/Logo";
import type { SessionRequest } from "./PracticeSession";

export function PracticeHome() {
  const navigate = useNavigate();
  const mastery = useProfileStore((s) => s.mastery);
  const chapterProgress = useProfileStore((s) => s.chapterProgress);
  const hasTutorialCompleted = useProfileStore((s) => s.hasTutorialCompleted);

  const go = (request: SessionRequest) => navigate("/practice/session", { state: request });

  return (
    <div className="h-screen w-screen overflow-y-auto bg-void px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="opacity-80 transition-opacity hover:opacity-100">
            <Logo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Main Menu
          </Button>
        </div>

        {!hasTutorialCompleted && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Panel className="flex items-center justify-between border-cyan/30 bg-cyan/[0.06] px-5 py-4">
              <div>
                <div className="font-mono text-xs font-semibold tracking-widest text-cyan">NEW HERE?</div>
                <div className="mt-0.5 text-sm text-text-secondary">Learn the arena in about 2 minutes.</div>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate("/practice/tutorial")}>
                Start Tutorial
              </Button>
            </Panel>
          </motion.div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <QuickCard
            title="QUICK PRACTICE"
            subtitle="5 random challenges"
            accent="cyan"
            onClick={() => go({ kind: "quick" })}
          />
          <QuickCard title="SPEED RUN" subtitle="Untimed — chain as many as you can" accent="amber" onClick={() => go({ kind: "speedrun" })} />
          <QuickCard title="BOSS DOM" subtitle="One hard target. No shortcuts." accent="red" onClick={() => go({ kind: "boss" })} />
        </div>

        <div className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">CHAPTERS</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CHAPTERS.map((chapter) => {
            const m = mastery[chapter.id];
            const progress = chapterProgress[chapter.id];
            return (
              <button
                key={chapter.id}
                onClick={() => go({ kind: "chapter", category: chapter.id })}
                className="text-left"
              >
                <Panel className="flex items-center justify-between px-5 py-4 transition-colors hover:border-border-strong">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-text-tertiary">CH.{chapter.number}</span>
                      <span className="font-semibold text-text-primary">{chapter.title}</span>
                      {progress?.completed && <Tag tone="green">DONE</Tag>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-text-secondary">{chapter.subtitle}</div>
                    <div className="mt-2 h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-cyan" style={{ width: `${m?.score ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="ml-3 font-mono text-lg font-bold text-text-tertiary">{m?.score ?? 0}</div>
                </Panel>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  title,
  subtitle,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  accent: "cyan" | "amber" | "red";
  onClick: () => void;
}) {
  const accentClasses = {
    cyan: "border-cyan/30 hover:bg-cyan/[0.08] text-cyan",
    amber: "border-amber/30 hover:bg-amber/[0.08] text-amber",
    red: "border-red/30 hover:bg-red/[0.08] text-red",
  }[accent];
  return (
    <button onClick={onClick} className={`rounded-2xl border bg-surface-2/60 px-5 py-5 text-left transition-colors ${accentClasses}`}>
      <div className="font-mono text-sm font-bold tracking-wide">{title}</div>
      <div className="mt-1 text-xs text-text-secondary">{subtitle}</div>
    </button>
  );
}
