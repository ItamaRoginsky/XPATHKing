import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ChallengeCategory, Difficulty } from "@xpath-arena/shared";
import { chapterFor } from "@xpath-arena/challenge-engine";
import { usePracticeSession } from "../engine/usePracticeSession";
import { buildBossSession, buildChapterSession, buildQuickPracticeSession, buildSpeedRunBatch, weakestCategory } from "../engine/build-session";
import { useProfileStore } from "../state/profile-store";
import { SiteFrame } from "../components/SiteFrame";
import { DomExplorer } from "../components/DomExplorer";
import { XPathConsole } from "../components/XPathConsole";
import { RoundIntro } from "../components/RoundIntro";
import { RoundResult } from "../components/RoundResult";
import { SessionComplete } from "../components/SessionComplete";
import { Panel } from "../design/primitives";

export type SessionRequest =
  | { kind: "chapter"; category: ChallengeCategory }
  | { kind: "quick" }
  | { kind: "speedrun" }
  | { kind: "boss" };

function resolveDifficulty(
  settingsDifficulty: Difficulty | "adaptive",
  mastery: Record<ChallengeCategory, { score: number; attempts: number; category: ChallengeCategory; correct: number }>,
): Difficulty {
  if (settingsDifficulty !== "adaptive") return settingsDifficulty;
  const weak = weakestCategory(mastery);
  const chapter = chapterFor(weak);
  return chapter.difficulty;
}

export function PracticeSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const request = useMemo<SessionRequest>(() => (location.state as SessionRequest | null) ?? { kind: "quick" }, [location.state]);

  const settings = useProfileStore((s) => s.settings);
  const mastery = useProfileStore((s) => s.mastery);
  const recordRound = useProfileStore((s) => s.recordRound);
  const advanceChapter = useProfileStore((s) => s.advanceChapter);

  // Adaptive difficulty is resolved once, at session start — recomputing it
  // mid-session (as mastery updates round-to-round) would silently swap the
  // difficulty of an in-progress session, which reads as a bug, not a feature.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const masteryRef = useRef(mastery);
  masteryRef.current = mastery;

  const [sessionKey, setSessionKey] = useState(0);
  const resolvedDifficulty = useMemo(
    () => resolveDifficulty(settingsRef.current.difficulty, masteryRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request, sessionKey],
  );
  const initialChallenges = useMemo(() => buildForRequest(request, resolvedDifficulty), [request, resolvedDifficulty]);

  const isSpeedrun = request.kind === "speedrun";
  const [speedrunBatch, setSpeedrunBatch] = useState(1);

  const session = usePracticeSession({
    challenges: initialChallenges,
    mode: isSpeedrun
      ? {
          kind: "speedrun",
          onNeedMoreChallenges: () => {
            setSpeedrunBatch((b) => b + 1);
            return buildSpeedRunBatch(resolvedDifficulty, speedrunBatch * 8);
          },
        }
      : { kind: "standard" },
    onRoundComplete: (record) => {
      recordRound({
        category: record.challenge.category,
        correct: record.result.correct,
        timeTakenMs: record.timeTakenMs,
        hintsUsed: record.hintsUsed,
        comboAtEnd: record.score.comboMultiplier,
        qualityScore: record.result.quality.score,
      });
      if (record.result.correct && request.kind === "chapter") {
        advanceChapter(record.challenge.category);
      }
    },
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const matchedIds = useMemo(() => new Set(session.evaluation.matchedNodeIds), [session.evaluation]);
  const targetIds = useMemo(() => new Set(session.current?.targetNodeIds ?? []), [session.current]);
  const isExactTarget =
    session.evaluation.ok &&
    matchedIds.size === targetIds.size &&
    matchedIds.size > 0 &&
    [...matchedIds].every((id) => targetIds.has(id));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/practice");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  if (!session.current) {
    return (
      <div className="flex h-screen items-center justify-center bg-void text-text-secondary">
        No challenges available.
      </div>
    );
  }

  const chapter = chapterFor(session.current.category);
  const chapterTitle = request.kind === "speedrun" ? "SPEED RUSH" : request.kind === "boss" ? "BOSS DOM" : chapter.title;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void">
      <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/practice")} className="font-mono text-xs text-text-tertiary hover:text-text-secondary">
            ← EXIT
          </button>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="font-mono text-xs font-semibold tracking-widest text-cyan">{chapterTitle.toUpperCase()}</span>
          {!isSpeedrun && (
            <span className="font-mono text-xs text-text-tertiary">
              ROUND {session.index + 1}/{session.total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="text-text-tertiary">SCORE</span>
          <motion.span key={session.totalScore} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-bold text-text-primary">
            {session.totalScore.toLocaleString()}
          </motion.span>
          {isSpeedrun && session.phase === "playing" && (
            <button
              onClick={session.endSession}
              className="ml-2 rounded-md border border-border-subtle px-2 py-1 font-mono text-xs text-text-tertiary hover:border-amber hover:text-amber"
            >
              END RUN
            </button>
          )}
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-px bg-border-subtle lg:grid-cols-[1.15fr_1fr_360px]">
          <Panel className="overflow-hidden rounded-none border-0">
            <SiteFrame
              key={`site-${session.current.id}`}
              html={session.current.html}
              matchedIds={matchedIds}
              targetIds={targetIds}
              isLocked={isExactTarget}
              onReady={session.onDocReady}
              onHoverNode={setHoveredId}
            />
          </Panel>
          <Panel className="overflow-hidden rounded-none border-0 bg-surface-2/40">
            <DomExplorer
              key={`dom-${session.current.id}`}
              html={session.current.html}
              matchedIds={matchedIds}
              targetIds={targetIds}
              isLocked={isExactTarget}
              hoveredId={hoveredId}
              onHoverNode={setHoveredId}
            />
          </Panel>
          <Panel className="overflow-hidden rounded-none border-0">
            <XPathConsole
              challenge={session.current}
              xpath={session.xpath}
              onChange={session.setXpath}
              onSubmit={session.submit}
              evaluation={session.evaluation}
              isExactTarget={isExactTarget}
              timeRemaining={session.timeRemaining}
              comboMultiplier={session.comboMultiplier}
              comboStreak={session.comboStreak}
              autocompleteEnabled={settings.autocomplete}
              hintLevel={session.hintLevel}
              onRequestHint={session.requestHint}
              shakeToken={session.shake}
              disabled={session.phase !== "playing"}
            />
          </Panel>
        </div>

        <AnimatePresence mode="wait">
          {session.phase === "intro" && (
            <RoundIntro
              key={`intro-${session.current.id}`}
              challenge={session.current}
              roundNumber={session.index + 1}
              totalRounds={session.total}
              onStart={session.startRound}
            />
          )}
          {session.phase === "result" && session.lastRecord && (
            <RoundResult key={`result-${session.current.id}`} record={session.lastRecord} onContinue={session.advance} isLastRound={session.index + 1 >= session.total} />
          )}
          {session.phase === "complete" && (
            <SessionComplete
              key="complete"
              records={session.records}
              totalScore={session.totalScore}
              onReplay={() => setSessionKey((k) => k + 1)}
              onExit={() => navigate("/practice")}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function buildForRequest(request: SessionRequest, difficulty: Difficulty) {
  switch (request.kind) {
    case "chapter":
      return buildChapterSession(request.category, difficulty, 5);
    case "quick":
      return buildQuickPracticeSession(difficulty, 5);
    case "speedrun":
      return buildSpeedRunBatch(difficulty, 0, 8);
    case "boss":
      return buildBossSession();
  }
}
