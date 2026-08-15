import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildFormScene, type FieldRef } from "../templates/form";
import { descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

function uniqueByTypeAndRequired(fields: FieldRef[]): FieldRef[] {
  const counts = new Map<string, number>();
  for (const f of fields) {
    const key = `${f.inputType}:${f.required}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return fields.filter((f) => counts.get(`${f.inputType}:${f.required}`) === 1);
}

const requiredTypeCombo: Variant = (rng, difficulty) => {
  const scene = buildFormScene(rng, { fieldCount: 5 });
  const candidates = uniqueByTypeAndRequired(scene.fields);
  const target = candidates.length > 0 ? rng.pick(candidates) : scene.fields[0]!;
  const allInputs = descendants(scene.root).filter((n) => n.tag === "input");
  const distractors = allInputs.filter((n) => n.id !== target.input.id).map((n) => n.id);
  const requiredWord = target.required ? "is required" : "is optional";

  return {
    difficulty,
    category: "conditions",
    type: "exact-target",
    template: { templateId: "form", siteName: "NovaCart Account" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.input.id],
    distractorNodeIds: distractors,
    objective: `Find the input that has type="${target.inputType}" and ${requiredWord}.`,
    flavor: "Combine two conditions with 'and' to nail down one element.",
    rules: [],
    referenceSolutions: target.required
      ? [{ xpath: `//input[@type='${target.inputType}' and @required]` }]
      : [{ xpath: `//input[@type='${target.inputType}' and not(@required)]` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "A predicate can hold more than one condition.",
      "Join conditions with the 'and' keyword.",
      `Try //input[@type='${target.inputType}' and ...].`,
      target.required
        ? `//input[@type='${target.inputType}' and @required]`
        : `//input[@type='${target.inputType}' and not(@required)]`,
    ],
  };
};

export const conditionsVariants: Variant[] = [requiredTypeCombo];
