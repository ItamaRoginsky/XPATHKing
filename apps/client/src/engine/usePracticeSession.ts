import { useCallback, useEffect, useRef, useState } from "react";
import type { Challenge, EvaluationResult, ScoreBreakdown, SubmissionResult } from "@xpath-arena/shared";
import { evaluateXPath, gradeSubmission, computeRoundScore, ComboTracker } from "@xpath-arena/game-engine";

export type SessionPhase = "intro" | "playing" | "result" | "complete";

export interface RoundRecord {
  challenge: Challenge;
  result: SubmissionResult;
  score: ScoreBreakdown;
  timeTakenMs: number;
  hintsUsed: number;
  timedOut: boolean;
  xpath: string;
}

export interface SessionMode {
  /** Speed rush = one master countdown, auto-advance on every correct answer. */
  kind: "standard" | "speedrun";
  speedrunSeconds?: number;
  onNeedMoreChallenges?: () => Challenge[];
}

interface UsePracticeSessionArgs {
  challenges: Challenge[];
  mode: SessionMode;
  onSessionComplete?: (records: RoundRecord[], totalScore: number) => void;
  onRoundComplete?: (record: RoundRecord) => void;
}

export function usePracticeSession({ challenges, mode, onSessionComplete, onRoundComplete }: UsePracticeSessionArgs) {
  const [queue, setQueue] = useState<Challenge[]>(challenges);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>("intro");
  const [xpath, setXpathState] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult>({ ok: true, matchedNodeIds: [], matchCount: 0 });
  const [hintLevel, setHintLevel] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastRecord, setLastRecord] = useState<RoundRecord | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [records, setRecords] = useState<RoundRecord[]>([]);
  const [shake, setShake] = useState(0);
  const [scorePop, setScorePop] = useState<{ id: number; score: ScoreBreakdown } | null>(null);

  const [timeRemaining, setTimeRemaining] = useState(() => queue[0]?.timeLimitSeconds ?? 30);
  const [speedrunRemaining, setSpeedrunRemaining] = useState(mode.speedrunSeconds ?? 60);

  const docRef = useRef<Document | null>(null);
  const roundStartRef = useRef<number>(0);
  const comboRef = useRef(new ComboTracker());
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboStreak, setComboStreak] = useState(0);
  const scorePopId = useRef(0);

  const current = queue[index] ?? null;

  useEffect(() => {
    setQueue(challenges);
    setIndex(0);
    setPhase("intro");
    setRecords([]);
    setTotalScore(0);
    comboRef.current.reset();
    setComboMultiplier(1);
    setComboStreak(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges]);

  const onDocReady = useCallback((doc: Document) => {
    docRef.current = doc;
  }, []);

  const runEvaluation = useCallback((text: string) => {
    const doc = docRef.current;
    if (!doc) {
      setEvaluation({ ok: true, matchedNodeIds: [], matchCount: 0 });
      return;
    }
    setEvaluation(evaluateXPath(doc, doc, text));
  }, []);

  const setXpath = useCallback(
    (text: string) => {
      setXpathState(text);
      runEvaluation(text);
    },
    [runEvaluation],
  );

  const startRound = useCallback(() => {
    setPhase("playing");
    setXpathState("");
    setEvaluation({ ok: true, matchedNodeIds: [], matchCount: 0 });
    setHintLevel(0);
    setFailedAttempts(0);
    roundStartRef.current = performance.now();
    if (current) setTimeRemaining(current.timeLimitSeconds);
  }, [current]);

  // countdown timer
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = setInterval(() => {
      if (mode.kind === "speedrun") {
        setSpeedrunRemaining((t) => Math.max(0, t - 0.1));
      } else {
        setTimeRemaining((t) => Math.max(0, t - 0.1));
      }
    }, 100);
    return () => clearInterval(tick);
  }, [phase, mode.kind]);

  const finishRound = useCallback(
    (result: SubmissionResult, timedOut: boolean, submittedXPath: string) => {
      const doc = docRef.current;
      if (!current || !doc) return;

      const timeTakenMs = performance.now() - roundStartRef.current;
      const isFirstSolve = true; // practice mode: player is always "first"

      const multiplier = comboRef.current.registerResult(result.correct, hintLevel);
      setComboMultiplier(multiplier);
      setComboStreak(comboRef.current.currentStreak);

      const score = computeRoundScore({
        correct: result.correct,
        timeTakenMs,
        timeLimitSeconds: current.timeLimitSeconds,
        qualityTier: result.quality.tier,
        isFirstSolve,
        hintsUsed: hintLevel,
        failedAttempts,
        comboMultiplier: multiplier,
      });

      const record: RoundRecord = {
        challenge: current,
        result,
        score,
        timeTakenMs,
        hintsUsed: hintLevel,
        timedOut,
        xpath: submittedXPath,
      };
      setLastRecord(record);
      setRecords((r) => [...r, record]);
      setTotalScore((t) => t + score.total);
      scorePopId.current += 1;
      setScorePop({ id: scorePopId.current, score });
      onRoundComplete?.(record);

      if (mode.kind === "speedrun") {
        // auto-advance immediately on correct; on timeout, end session
        if (result.correct) {
          advanceSpeedrun();
        } else {
          setPhase("result");
        }
      } else {
        setPhase("result");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, hintLevel, failedAttempts, mode.kind, onRoundComplete],
  );

  const advanceSpeedrun = useCallback(() => {
    setIndex((i) => {
      const nextIndex = i + 1;
      if (nextIndex >= queue.length && mode.onNeedMoreChallenges) {
        const more = mode.onNeedMoreChallenges();
        setQueue((q) => [...q, ...more]);
      }
      return nextIndex;
    });
    setXpathState("");
    setEvaluation({ ok: true, matchedNodeIds: [], matchCount: 0 });
    setHintLevel(0);
    setFailedAttempts(0);
    roundStartRef.current = performance.now();
    setPhase("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length, mode]);

  const submit = useCallback(() => {
    const doc = docRef.current;
    if (!current || !doc || phase !== "playing") return;
    if (!xpath.trim()) return;

    const result = gradeSubmission(doc, doc, xpath, current);
    if (result.correct) {
      finishRound(result, false, xpath);
    } else {
      setFailedAttempts((f) => f + 1);
      setShake((s) => s + 1);
    }
  }, [current, phase, xpath, finishRound]);

  const requestHint = useCallback(() => {
    if (!current) return;
    setHintLevel((h) => Math.min(current.hints.length, h + 1));
  }, [current]);

  const advance = useCallback(() => {
    if (mode.kind === "speedrun") return; // speedrun advances automatically
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      setPhase("complete");
      onSessionComplete?.(records, totalScore);
      return;
    }
    setIndex(nextIndex);
    setPhase("intro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, queue.length, records, totalScore, mode.kind]);

  // timeout handling
  useEffect(() => {
    if (phase !== "playing") return;
    const remaining = mode.kind === "speedrun" ? speedrunRemaining : timeRemaining;
    if (remaining <= 0) {
      if (mode.kind === "speedrun") {
        setPhase("complete");
        onSessionComplete?.(records, totalScore);
      } else if (docRef.current && current) {
        const emptyResult = gradeSubmission(docRef.current, docRef.current, xpath || "//__timeout__", current);
        finishRound({ ...emptyResult, correct: false }, true, xpath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, speedrunRemaining, phase]);

  return {
    current,
    index,
    total: queue.length,
    phase,
    xpath,
    setXpath,
    evaluation,
    hintLevel,
    failedAttempts,
    lastRecord,
    totalScore,
    records,
    shake,
    scorePop,
    comboMultiplier,
    comboStreak,
    timeRemaining: mode.kind === "speedrun" ? speedrunRemaining : timeRemaining,
    onDocReady,
    startRound,
    submit,
    requestHint,
    advance,
  };
}
