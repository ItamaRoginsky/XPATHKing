import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { evaluateXPath } from "@xpath-arena/game-engine";
import type { EvaluationResult } from "@xpath-arena/shared";
import { SiteFrame } from "../components/SiteFrame";
import { DomExplorer } from "../components/DomExplorer";
import { XPathEditor } from "../components/XPathEditor";
import { Button, Panel } from "../design/primitives";
import { Logo } from "../design/Logo";
import { useProfileStore } from "../state/profile-store";

const TUTORIAL_HTML = `<div class="tutorial-page">
  <header class="site-header">
    <div class="brand">NovaCart</div>
    <nav class="nav-links"></nav>
  </header>
  <div class="catalog">
    <section class="category">
      <h2>Account</h2>
      <div class="products">
        <div class="product-card" data-xa-id="btn-help-card"><button data-xa-id="btn-help" class="btn" type="button">Help</button></div>
        <div class="product-card" data-xa-id="btn-login-card"><button data-xa-id="btn-login" class="btn btn-primary" type="button">Login</button></div>
        <div class="product-card" data-xa-id="btn-signup-card"><button data-xa-id="btn-signup" class="btn" type="button">Sign Up</button></div>
      </div>
    </section>
  </div>
</div>`;

const TARGET_ID = "btn-login";

type StepKind = "welcome" | "broad" | "narrow" | "done";

interface Step {
  kind: StepKind;
  title: string;
  body: string;
  showEditor: boolean;
}

const STEPS: Step[] = [
  {
    kind: "welcome",
    title: "Welcome to the arena",
    body: "Every round shows a real webpage. Your job: write one XPath expression that finds exactly one target element.",
    showEditor: false,
  },
  {
    kind: "broad",
    title: "Find the Login button",
    body: "Try typing //button below and watch the page react.",
    showEditor: true,
  },
  {
    kind: "narrow",
    title: "Too many matches",
    body: "That matched all three buttons. Narrow it down with the button's own text: //button[text()='Login']",
    showEditor: true,
  },
  {
    kind: "done",
    title: "Target locked",
    body: "That's the whole loop: read the DOM, write an XPath, lock the target. Score, speed, and quality all layer on top of this.",
    showEditor: false,
  },
];

export function Tutorial() {
  const navigate = useNavigate();
  const markTutorialComplete = useProfileStore((s) => s.markTutorialComplete);

  const [stepIndex, setStepIndex] = useState(0);
  const [xpath, setXpath] = useState("");
  const [doc, setDoc] = useState<Document | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult>({ ok: true, matchedNodeIds: [], matchCount: 0 });

  const step = STEPS[stepIndex]!;
  const matchedIds = useMemo(() => new Set(evaluation.matchedNodeIds), [evaluation]);
  const targetIds = useMemo(() => new Set([TARGET_ID]), []);
  const isExactTarget = evaluation.ok && matchedIds.size === 1 && matchedIds.has(TARGET_ID);

  useEffect(() => {
    if (doc) setEvaluation(evaluateXPath(doc, doc, xpath));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xpath, doc]);

  useEffect(() => {
    if (step.kind === "broad" && evaluation.ok && evaluation.matchCount >= 2) {
      const t = setTimeout(() => setStepIndex((i) => i + 1), 700);
      return () => clearTimeout(t);
    }
    if (step.kind === "narrow" && isExactTarget) {
      const t = setTimeout(() => setStepIndex((i) => i + 1), 700);
      return () => clearTimeout(t);
    }
  }, [step.kind, evaluation, isExactTarget]);

  const finish = () => {
    markTutorialComplete();
    navigate("/practice");
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-void">
      <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <Logo size="sm" />
        <button onClick={finish} className="font-mono text-xs text-text-tertiary hover:text-text-secondary">
          SKIP TUTORIAL →
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 gap-px bg-border-subtle lg:grid-cols-[1.2fr_1fr_360px]">
          <Panel className="overflow-hidden rounded-none border-0">
            <SiteFrame
              html={TUTORIAL_HTML}
              matchedIds={matchedIds}
              targetIds={targetIds}
              isLocked={isExactTarget}
              onReady={setDoc}
            />
          </Panel>
          <Panel className="overflow-hidden rounded-none border-0 bg-surface-2/40">
            <DomExplorer html={TUTORIAL_HTML} matchedIds={matchedIds} targetIds={targetIds} isLocked={isExactTarget} hoveredId={null} />
          </Panel>
          <Panel className="flex flex-col overflow-hidden rounded-none border-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.kind}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border-b border-border-subtle px-5 py-5"
              >
                <div className="mb-1.5 font-mono text-[11px] font-semibold tracking-widest text-cyan">
                  STEP {stepIndex + 1} / {STEPS.length}
                </div>
                <h2 className="mb-2 text-lg font-bold text-text-primary">{step.title}</h2>
                <p className="text-sm leading-relaxed text-text-secondary">{step.body}</p>
              </motion.div>
            </AnimatePresence>

            {step.showEditor && (
              <div className="border-b border-border-subtle px-3 pt-2">
                <div className="px-1">
                  <StatusHint evaluation={evaluation} isExactTarget={isExactTarget} />
                </div>
                <XPathEditor value={xpath} onChange={setXpath} onSubmit={() => {}} placeholder="//button" />
              </div>
            )}

            <div className="mt-auto flex justify-end px-5 py-4">
              {step.kind === "welcome" && (
                <Button variant="primary" onClick={() => setStepIndex(1)}>
                  Let's go
                </Button>
              )}
              {step.kind === "done" && (
                <Button variant="primary" onClick={finish}>
                  Start Practicing
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StatusHint({ evaluation, isExactTarget }: { evaluation: EvaluationResult; isExactTarget: boolean }) {
  if (!evaluation.ok) return <div className="font-mono text-sm font-bold text-red">{evaluation.error}</div>;
  if (isExactTarget) return <div className="font-mono text-sm font-bold text-green text-glow-green">TARGET LOCKED</div>;
  if (evaluation.matchCount === 0) return <div className="font-mono text-sm text-text-tertiary">NO MATCHES</div>;
  return <div className="font-mono text-sm font-bold text-amber">{evaluation.matchCount} MATCHES</div>;
}
