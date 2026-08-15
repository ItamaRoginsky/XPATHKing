import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildFormScene } from "../templates/form";
import { descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const findFieldByType: Variant = (rng, difficulty) => {
  const scene = buildFormScene(rng);
  const passwordField = scene.fields.find((f) => f.name === "password")!;
  const allInputs = descendants(scene.root).filter((n) => n.tag === "input");
  const distractors = allInputs.filter((n) => n.id !== passwordField.input.id).map((n) => n.id);

  return {
    difficulty,
    category: "attributes",
    type: "exact-target",
    template: { templateId: "form", siteName: "NovaCart Account" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [passwordField.input.id],
    distractorNodeIds: distractors,
    objective: "Find the password input field.",
    flavor: "Attributes are the fingerprints of the DOM.",
    rules: [],
    referenceSolutions: [{ xpath: "//input[@type='password']" }, { xpath: "//input[@name='password']" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [
      "Every input has a type attribute.",
      "Password fields use type=\"password\".",
      "Try //input[@type='...'] with the right value.",
      "//input[@type='password'] is unique and stable.",
    ],
  };
};

const findSubmitWithoutId: Variant = (rng, difficulty) => {
  const scene = buildFormScene(rng);
  const allButtons = descendants(scene.root).filter((n) => n.tag === "button");
  const distractors = allButtons.filter((n) => n.id !== scene.submitButton.id).map((n) => n.id);

  return {
    difficulty,
    category: "attributes",
    type: "restricted",
    template: { templateId: "form", siteName: "NovaCart Account" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [scene.submitButton.id],
    distractorNodeIds: distractors,
    objective: "Find the submit button — without using its id.",
    flavor: "IDs are convenient. They're also not always there.",
    rules: [{ kind: "forbid-attribute", attribute: "id", reason: "Challenge forbids @id" }],
    referenceSolutions: [{ xpath: "//button[@type='submit']" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "Look for another attribute unique to this button.",
      "The type attribute distinguishes submit buttons from regular ones.",
      "Try //button[@type='...'].",
      "//button[@type='submit'] avoids @id entirely.",
    ],
  };
};

const findRequiredField: Variant = (rng, difficulty) => {
  const scene = buildFormScene(rng);
  const required = scene.fields.filter((f) => f.required);
  const target = rng.pick(required);
  const allInputs = descendants(scene.root).filter((n) => n.tag === "input");
  const distractors = allInputs.filter((n) => n.id !== target.input.id).map((n) => n.id);

  return {
    difficulty,
    category: "attributes",
    type: "exact-target",
    template: { templateId: "form", siteName: "NovaCart Account" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.input.id],
    distractorNodeIds: distractors,
    objective: `Find the required "${target.labelText}" input using its name attribute.`,
    flavor: "Combine attributes to zero in on one element.",
    rules: [],
    referenceSolutions: [{ xpath: `//input[@name='${target.name}']` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [
      "Every field has a name attribute matching its purpose.",
      `This field's name attribute is "${target.name}".`,
      "Use //input[@name='...'].",
      `//input[@name='${target.name}'] is exact.`,
    ],
  };
};

export const attributesVariants: Variant[] = [findFieldByType, findSubmitWithoutId, findRequiredField];
