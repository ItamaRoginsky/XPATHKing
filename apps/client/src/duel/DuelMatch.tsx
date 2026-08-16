import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Challenge, EvaluationResult, OpponentLiveState, RoundResult } from "@xpath-arena/shared";
import { evaluateXPath, gradeSubmission } from "@xpath-arena/game-engine";
import { SiteFrame } from "../components/SiteFrame";
import { DomExplorer } from "../components/DomExplorer";
import { XPathConsole } from "../components/XPathConsole";
import { Panel } from "../design/primitives";
import { useProfileStore } from "../state/profile-store";
import type { useMultiplayerClient } from "../multiplayer/useMultiplayerClient";
import { DuelRoundResult } from "./DuelRoundResult";
import { DuelComplete } from "./DuelComplete";

type Phase = "countdown" | "round" | "round-result" | "match-complete";

export function DuelMatch({ mp, onExit }: { mp: ReturnType<typeof useMultiplayerClient>; onExit: () => void }) {
  const autocompleteEnabled = useProfileStore((s) => s.settings.autocomplete);
  const you = mp.you!;
  const opponent = mp.players.find((p) => p.id !== you.id) ?? null;

  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdownSecs, setCountdownSecs] = useState(3);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);

  const [xpath, setXpathState] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult>({ ok: true, matchedNodeIds: [], matchCount: 0 });
  const [hintLevel, setHintLevel] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [hasLocked, setHasLocked] = useState(false);
  const [shake, setShake] = useState(0);

  const [opponentLive, setOpponentLive] = useState<OpponentLiveState | null>(null);
  const [opponentGone, setOpponentGone] = useState(false);

  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [allRounds, setAllRounds] = useState<RoundResult[]>([]);
  const [rematchRequested, setRematchRequested] = useState(false);

  const docRef = useRef<Document | null>(null);
  const roundStartRef = useRef(0);
  const liveStateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDocReady = useCallback((doc: Document) => {
    docRef.current = doc;
  }, []);

  const resetForNewMatch = useCallback(() => {
    setPhase("countdown");
    setCountdownSecs(3);
    setAllRounds([]);
    setLastRoundResult(null);
    setRematchRequested(false);
    setOpponentGone(false);
  }, []);

  // Server protocol events drive everything here — the whole screen is a
  // reaction to the message stream, not a client-owned state machine, since
  // the server is authoritative for pacing and grading.
  useEffect(() => {
    const unsub = mp.subscribe((msg) => {
      if (msg.type === "match-starting") {
        resetForNewMatch();
      } else if (msg.type === "rematch-starting") {
        resetForNewMatch();
      } else if (msg.type === "round-start") {
        setPhase("round");
        setRoundNumber(msg.roundNumber);
        setTotalRounds(msg.totalRounds);
        setChallenge(msg.challenge);
        setTimeRemaining(msg.durationSeconds);
        setXpathState("");
        setEvaluation({ ok: true, matchedNodeIds: [], matchCount: 0 });
        setHintLevel(0);
        setFailedAttempts(0);
        setHasLocked(false);
        setOpponentLive(null);
        roundStartRef.current = performance.now();
      } else if (msg.type === "opponent-live-state") {
        setOpponentLive(msg.state);
      } else if (msg.type === "round-result") {
        setPhase("round-result");
        setLastRoundResult(msg.result);
        setAllRounds((r) => [...r, msg.result]);
      } else if (msg.type === "match-complete") {
        setPhase("match-complete");
        setAllRounds(msg.rounds);
      } else if (msg.type === "opponent-disconnected") {
        setOpponentGone(true);
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp.subscribe]);

  // cosmetic countdown before round 1 / a rematch's round 1
  useEffect(() => {
    if (phase !== "countdown") return;
    setCountdownSecs(3);
    const tick = setInterval(() => setCountdownSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, [phase]);

  // cosmetic round timer — the server times the round out authoritatively
  useEffect(() => {
    if (phase !== "round") return;
    const tick = setInterval(() => setTimeRemaining((t) => Math.max(0, t - 0.1)), 100);
    return () => clearInterval(tick);
  }, [phase]);

  const sendLiveState = useCallback(
    (text: string, evalResult: EvaluationResult) => {
      if (liveStateTimer.current) clearTimeout(liveStateTimer.current);
      liveStateTimer.current = setTimeout(() => {
        const status = !text.trim() ? "idle" : evalResult.ok && evalResult.matchCount > 0 ? "matches" : "searching";
        mp.send({ type: "live-state", status, matchCount: evalResult.matchCount });
      }, 120);
    },
    [mp],
  );

  const setXpath = useCallback(
    (text: string) => {
      setXpathState(text);
      const doc = docRef.current;
      const result = doc ? evaluateXPath(doc, doc, text) : { ok: true, matchedNodeIds: [], matchCount: 0 };
      setEvaluation(result);
      sendLiveState(text, result);
    },
    [sendLiveState],
  );

  const submit = useCallback(() => {
    const doc = docRef.current;
    if (!challenge || !doc || phase !== "round" || hasLocked || !xpath.trim()) return;
    const result = gradeSubmission(doc, doc, xpath, challenge);
    if (result.correct) {
      const timeTakenMs = performance.now() - roundStartRef.current;
      mp.send({ type: "submit", xpath, timeTakenMs, hintsUsed: hintLevel, failedAttempts });
      setHasLocked(true);
    } else {
      setFailedAttempts((f) => f + 1);
      setShake((s) => s + 1);
    }
  }, [challenge, phase, hasLocked, xpath, hintLevel, failedAttempts, mp]);

  const requestHint = useCallback(() => {
    if (!challenge) return;
    setHintLevel((h) => Math.min(challenge.hints.length, h + 1));
  }, [challenge]);

  const matchedIds = useMemo(() => new Set(evaluation.matchedNodeIds), [evaluation]);
  const targetIds = useMemo(() => new Set(challenge?.targetNodeIds ?? []), [challenge]);
  const isExactTarget = hasLocked || (evaluation.ok && matchedIds.size === targetIds.size && matchedIds.size > 0 && [...matchedIds].every((id) => targetIds.has(id)));

  const myTotal = allRounds.reduce((sum, r) => sum + (r.results[you.id]?.score.total ?? 0), 0);
  const theirTotal = opponent ? allRounds.reduce((sum, r) => sum + (r.results[opponent.id]?.score.total ?? 0), 0) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onExit]);

  if (!challenge) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-void">
        <CountdownPanel secs={countdownSecs} opponentName={opponent?.name ?? "opponent"} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void">
      <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="font-mono text-xs text-text-tertiary hover:text-text-secondary">
            ← LEAVE
          </button>
          <div className="h-4 w-px bg-border-subtle" />
          <span className="font-mono text-xs font-semibold tracking-widest text-cyan">1V1 DUEL</span>
          <span className="font-mono text-xs text-text-tertiary">
            ROUND {roundNumber}/{totalRounds}
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-sm">
          <ScoreChip label="YOU" value={myTotal} />
          <OpponentChip live={opponentLive} gone={opponentGone} />
          <ScoreChip label={opponent?.name?.slice(0, 10).toUpperCase() ?? "OPP"} value={theirTotal} />
        </div>
      </header>

      {opponentGone && phase === "round" && (
        <div className="border-b border-red/30 bg-red/10 px-5 py-1.5 text-center font-mono text-xs text-red">
          {opponent?.name ?? "Your opponent"} disconnected. The match will still resolve.
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-px bg-border-subtle lg:grid-cols-[1.15fr_1fr_360px]">
          <Panel className="overflow-hidden rounded-none border-0">
            <SiteFrame key={`site-${challenge.id}`} html={challenge.html} matchedIds={matchedIds} targetIds={targetIds} isLocked={isExactTarget} onReady={onDocReady} />
          </Panel>
          <Panel className="overflow-hidden rounded-none border-0 bg-surface-2/40">
            <DomExplorer key={`dom-${challenge.id}`} html={challenge.html} matchedIds={matchedIds} targetIds={targetIds} isLocked={isExactTarget} hoveredId={null} />
          </Panel>
          <Panel className="overflow-hidden rounded-none border-0">
            <XPathConsole
              challenge={challenge}
              xpath={xpath}
              onChange={setXpath}
              onSubmit={submit}
              evaluation={evaluation}
              isExactTarget={isExactTarget}
              timeRemaining={timeRemaining}
              comboMultiplier={1}
              comboStreak={0}
              autocompleteEnabled={autocompleteEnabled}
              hintLevel={hintLevel}
              onRequestHint={requestHint}
              shakeToken={shake}
              disabled={phase !== "round" || hasLocked}
            />
          </Panel>
        </div>

        {hasLocked && phase === "round" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-green/40 px-4 py-1.5 font-mono text-xs font-bold tracking-widest text-green shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            LOCKED ON — waiting for round to end…
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {phase === "round-result" && lastRoundResult && <DuelRoundResult key={`result-${lastRoundResult.roundNumber}`} result={lastRoundResult} you={you} opponent={opponent} />}
          {phase === "match-complete" && (
            <DuelComplete
              key="complete"
              rounds={allRounds}
              you={you}
              opponent={opponent}
              onRematch={() => {
                if (opponentGone) return;
                setRematchRequested(true);
                mp.send({ type: "rematch-vote" });
              }}
              onExit={onExit}
            />
          )}
        </AnimatePresence>

        {phase === "match-complete" && rematchRequested && !opponentGone && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 font-mono text-xs text-text-tertiary">
            Waiting for {opponent?.name ?? "opponent"} to accept the rematch…
          </div>
        )}
      </div>
    </div>
  );
}

function CountdownPanel({ secs, opponentName }: { secs: number; opponentName: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <div className="font-mono text-xs tracking-widest text-text-tertiary">DUEL VS {opponentName.toUpperCase()}</div>
      <motion.div key={secs} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 text-7xl font-bold text-cyan text-glow-cyan">
        {secs > 0 ? secs : "GO"}
      </motion.div>
    </motion.div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] tracking-widest text-text-tertiary">{label}</span>
      <span className="font-bold text-text-primary">{value.toLocaleString()}</span>
    </div>
  );
}

function OpponentChip({ live, gone }: { live: OpponentLiveState | null; gone: boolean }) {
  if (gone) return <Tag tone="red">OFFLINE</Tag>;
  if (!live || live.status === "idle") return <Tag tone="neutral">watching</Tag>;
  if (live.status === "locked-on" || live.status === "submitted") return <Tag tone="green">LOCKED ON</Tag>;
  if (live.status === "matches") return <Tag tone="amber">{live.matchCount} matches</Tag>;
  return <Tag tone="neutral">searching…</Tag>;
}

function Tag({ children, tone }: { children: ReactNode; tone: "neutral" | "green" | "amber" | "red" }) {
  const cls = { neutral: "text-text-tertiary", green: "text-green", amber: "text-amber", red: "text-red" }[tone];
  return <span className={`rounded-full border border-border-subtle px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cls}`}>{children}</span>;
}
