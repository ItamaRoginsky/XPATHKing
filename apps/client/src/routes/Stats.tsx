import { useNavigate } from "react-router-dom";
import { CATEGORY_ORDER, chapterFor } from "@xpath-arena/challenge-engine";
import { useProfileStore, rankForRating } from "../state/profile-store";
import { Button, Panel } from "../design/primitives";
import { Logo } from "../design/Logo";

export function Stats() {
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const stats = useProfileStore((s) => s.stats);
  const mastery = useProfileStore((s) => s.mastery);
  const achievements = useProfileStore((s) => s.achievements);

  const rank = rankForRating(stats.rating);
  const avgSolveS = stats.challengesSolved > 0 ? (stats.totalSolveTimeMs / stats.challengesSolved / 1000).toFixed(1) : "—";
  const fastestS = stats.fastestSolveMs !== null ? (stats.fastestSolveMs / 1000).toFixed(1) : "—";

  return (
    <div className="h-screen w-screen overflow-y-auto bg-void px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="opacity-80 transition-opacity hover:opacity-100">
            <Logo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Main Menu
          </Button>
        </div>

        <Panel className="mb-6 flex items-center justify-between px-6 py-6">
          <div>
            <div className="text-xl font-bold text-text-primary">{name}</div>
            <div className="mt-1 font-mono text-xs tracking-widest text-cyan">{rank.toUpperCase()}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan text-glow-cyan">{stats.rating}</div>
            <div className="font-mono text-[10px] tracking-widest text-text-tertiary">RATING</div>
          </div>
        </Panel>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Solved" value={`${stats.challengesSolved}`} />
          <StatTile label="Accuracy" value={stats.challengesAttempted > 0 ? `${Math.round((stats.challengesSolved / stats.challengesAttempted) * 100)}%` : "—"} />
          <StatTile label="Avg Solve" value={`${avgSolveS}s`} />
          <StatTile label="Fastest" value={`${fastestS}s`} />
        </div>

        <Panel className="mb-6 px-6 py-6">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">XPATH PROFILE</h2>
          <div className="space-y-3">
            {CATEGORY_ORDER.filter((c) => c !== "mastery").map((category) => {
              const m = mastery[category];
              const chapter = chapterFor(category);
              return (
                <div key={category} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 text-xs text-text-secondary">{chapter.title}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-cyan" style={{ width: `${m.score}%` }} />
                  </div>
                  <div className="w-8 shrink-0 text-right font-mono text-xs text-text-tertiary">{m.score}</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="px-6 py-6">
          <h2 className="mb-4 font-mono text-xs font-semibold tracking-widest text-text-tertiary">ACHIEVEMENTS</h2>
          {achievements.length === 0 ? (
            <p className="text-sm text-text-tertiary">None yet — keep playing.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {achievements.map((a) => (
                <div key={a.id} className="rounded-lg border border-border-subtle bg-surface-2/60 px-3 py-2">
                  <div className="text-sm font-semibold text-text-primary">{a.name}</div>
                  <div className="text-xs text-text-tertiary">{a.description}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="px-4 py-4 text-center">
      <div className="text-xl font-bold text-text-primary">{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-text-tertiary">{label.toUpperCase()}</div>
    </Panel>
  );
}
