import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildDirectoryScene } from "../templates/directory";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const bossDeleteNoIndex: Variant = (rng, difficulty) => {
  const scene = buildDirectoryScene(rng, { memberCount: 9 });
  const target = rng.pick(scene.members);
  const allDeleteButtons = scene.members.map((m) => m.deleteButton.id);
  const distractors = allDeleteButtons.filter((id) => id !== target.deleteButton.id);

  return {
    difficulty,
    category: "mastery",
    type: "restricted",
    template: { templateId: "directory", siteName: "TeamSpace" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.deleteButton.id],
    distractorNodeIds: distractors,
    objective: `BOSS DOM — Find the Delete button belonging to the member whose email is ${target.email}, without using any positional index.`,
    flavor: "Nine near-identical rows. One correct button. No shortcuts.",
    rules: [{ kind: "forbid-index", reason: "Boss round forbids positional indexes" }],
    referenceSolutions: [
      { xpath: `//tr[.//small[text()='${target.email}']]//button[contains(@class,'delete')]` },
      { xpath: `//small[text()='${target.email}']/ancestor::tr//button[contains(@class,'delete')]` },
    ],
    scoreConfig: { basePoints: 1400, maxSpeedBonus: 450, speedWindowSeconds: 45 },
    timeLimitSeconds: 45,
    isBoss: true,
    hints: [
      "This is the same shape as the ancestor challenge — just under more pressure.",
      "Anchor on the email, then climb to the row that contains it.",
      "From the row, descend into the button with the 'delete' class.",
      `//tr[.//small[text()='${target.email}']]//button[contains(@class,'delete')]`,
    ],
  };
};

export const masteryVariants: Variant[] = [bossDeleteNoIndex];
