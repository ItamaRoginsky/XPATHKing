import { describe, it, expect, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import type { Challenge } from "@xpath-arena/shared";
import { RoundIntro } from "./RoundIntro";
import { RoundResult } from "./RoundResult";
import type { RoundRecord } from "../engine/usePracticeSession";

const challenge = {
  id: "c1",
  category: "basics",
  difficulty: "beginner",
  isBoss: false,
  objective: "Find the button",
  flavor: "",
  html: "<div></div>",
  targetNodeIds: ["x"],
  timeLimitSeconds: 30,
  rules: [],
  hints: [],
  referenceSolutions: [],
} as unknown as Challenge;

const record: RoundRecord = {
  challenge,
  result: {
    correct: true,
    exactMatch: true,
    matchedNodeIds: ["x"],
    quality: { score: 80, tier: "excellent", reasons: [], warnings: [] },
    ruleViolations: [],
  },
  score: { base: 1000, speed: 100, quality: 250, firstSolve: 100, hintPenalty: 0, failPenalty: 0, comboMultiplier: 1, total: 1450 },
  timeTakenMs: 4000,
  hintsUsed: 0,
  timedOut: false,
  xpath: "//button",
};

let container: HTMLDivElement;
let root: Root;

function mount(el: Parameters<Root["render"]>[0]) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(el);
  });
}

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function dispatchEnter(opts: { repeat: boolean }) {
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, repeat: opts.repeat });
  act(() => {
    window.dispatchEvent(event);
  });
}

describe("RoundIntro — held-Enter key repeat", () => {
  it("starts the round on a fresh Enter press", () => {
    let calls = 0;
    mount(<RoundIntro challenge={challenge} roundNumber={1} totalRounds={5} onStart={() => calls++} />);
    dispatchEnter({ repeat: false });
    expect(calls).toBe(1);
  });

  it("does not auto-start the round from a held-over key-repeat event", () => {
    // Simulates a player still physically holding Enter (e.g. from
    // submitting the previous round) when this screen mounts mid-hold.
    let calls = 0;
    mount(<RoundIntro challenge={challenge} roundNumber={1} totalRounds={5} onStart={() => calls++} />);
    dispatchEnter({ repeat: true });
    expect(calls).toBe(0);
  });
});

describe("RoundResult — held-Enter key repeat", () => {
  it("continues on a fresh Enter press", () => {
    let calls = 0;
    mount(<RoundResult record={record} onContinue={() => calls++} isLastRound={false} />);
    dispatchEnter({ repeat: false });
    expect(calls).toBe(1);
  });

  it("does not auto-skip the result screen from a held-over key-repeat event", () => {
    // This is the concrete bug: correct submit fires via Enter inside the
    // XPath editor (CodeMirror doesn't stopPropagation), the result screen
    // mounts this listener mid-keypress, and if the player is still
    // holding Enter down the very next OS auto-repeat keydown must not be
    // treated as a deliberate "continue" click — otherwise the result
    // screen (and score breakdown) flashes past instantly, and can cascade
    // into RoundIntro's own listener auto-starting the next round too.
    let calls = 0;
    mount(<RoundResult record={record} onContinue={() => calls++} isLastRound={false} />);
    dispatchEnter({ repeat: true });
    expect(calls).toBe(0);
  });
});
