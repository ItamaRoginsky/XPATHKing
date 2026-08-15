import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Kbd, Panel } from "../design/primitives";
import { Logo } from "../design/Logo";

export function HowToPlay() {
  const navigate = useNavigate();

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

        <h1 className="mb-2 text-2xl font-bold text-text-primary">How to Play</h1>
        <p className="mb-8 text-sm text-text-secondary">Understand the arena in about two minutes.</p>

        <Section title="The Loop">
          <p>
            Every round shows a real, simulated webpage plus its DOM. You get an objective — find one element, or a set
            of elements — and you write an XPath expression that selects exactly that. Matches update live as you type.
          </p>
        </Section>

        <Section title="Reading the status line">
          <ul className="space-y-1.5">
            <li>
              <span className="font-mono text-text-tertiary">NO MATCHES</span> — your expression doesn't select anything yet.
            </li>
            <li>
              <span className="font-mono text-amber">N MATCHES</span> — you're selecting more than one element. Narrow it down.
            </li>
            <li>
              <span className="font-mono text-red">1 MATCH — WRONG TARGET</span> — unique, but not the element the round wants.
            </li>
            <li>
              <span className="font-mono text-green">TARGET LOCKED</span> — exactly the right element(s). Submit it.
            </li>
          </ul>
        </Section>

        <Section title="Scoring">
          <p>Every correct submission scores on four axes, then a combo multiplier is applied on top:</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>Correctness — the base points for a correct answer</li>
            <li>Speed — solve faster relative to the round's time limit for a bonus</li>
            <li>XPath Quality — Fragile → Valid → Clean → Excellent → Legendary</li>
            <li>Hints and failed submissions subtract points, and break your combo</li>
          </ul>
        </Section>

        <Section title="XPath quality">
          <p>
            Two expressions can both be correct while one is much better automation. An absolute path like{" "}
            <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">/html/body/div[2]/div[3]/button</code> breaks
            the moment the page changes. A semantic selector like{" "}
            <code className="rounded bg-elevated px-1.5 py-0.5 font-mono text-xs">//button[@data-testid='checkout']</code> survives
            it. The arena scores and explains this after every round.
          </p>
        </Section>

        <Section title="Keyboard">
          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <ShortcutRow keys={["Enter"]} label="Submit" />
            <ShortcutRow keys={["Ctrl", "H"]} label="Request a hint" />
            <ShortcutRow keys={["Esc"]} label="Exit to menu" />
          </div>
        </Section>

        <div className="mt-10 flex justify-center">
          <Button variant="primary" onClick={() => navigate("/practice/tutorial")}>
            Try the Interactive Tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="mb-4 px-5 py-5">
      <h2 className="mb-2 font-mono text-xs font-semibold tracking-widest text-cyan">{title.toUpperCase()}</h2>
      <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
    </Panel>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2/60 px-3 py-2">
      <div className="flex gap-1">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </div>
      <span className="text-text-secondary">{label}</span>
    </div>
  );
}
