import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildEcommerceScene } from "../templates/ecommerce";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const buyButtonNoIndex: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng, { productCount: 7 });
  const eligible = scene.products.filter((p) => p.status !== "Sold Out");
  const target = rng.pick(eligible.length > 0 ? eligible : scene.products);
  const allBuyButtons = scene.products.map((p) => p.buyButton.id);
  const distractors = allBuyButtons.filter((id) => id !== target.buyButton.id);

  return {
    difficulty,
    category: "real-world",
    type: "restricted",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.buyButton.id],
    distractorNodeIds: distractors,
    objective: `Find the Buy Now button for "${target.name}" — without using a positional index like [2].`,
    flavor: "Real pages get reordered. Anchor to content, not position.",
    rules: [{ kind: "forbid-index", reason: "Challenge forbids positional indexes" }],
    referenceSolutions: [{ xpath: `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 35 },
    timeLimitSeconds: 35,
    hints: [
      "An index like [2] breaks the moment products are reordered.",
      "Anchor to the product's name instead of its position.",
      "A predicate with .//h3[text()='...'] filters by content, not order.",
      `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']`,
    ],
  };
};

export const realWorldVariants: Variant[] = [buyButtonNoIndex];
