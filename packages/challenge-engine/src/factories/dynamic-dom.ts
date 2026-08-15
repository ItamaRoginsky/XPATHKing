import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildEcommerceScene } from "../templates/ecommerce";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const buyButtonDynamicId: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng, { productCount: 6, useDynamicIds: true });
  const eligible = scene.products.filter((p) => p.status !== "Sold Out");
  const target = rng.pick(eligible.length > 0 ? eligible : scene.products);
  const allBuyButtons = scene.products.map((p) => p.buyButton.id);
  const distractors = allBuyButtons.filter((id) => id !== target.buyButton.id);

  return {
    difficulty,
    category: "dynamic-dom",
    type: "dynamic-dom",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.buyButton.id],
    distractorNodeIds: distractors,
    objective: `Find the Buy Now button for "${target.name}". The product container's id is regenerated on every page load — don't rely on it.`,
    flavor: "Automation IDs like 'product-83fk2a' are not stable across deploys.",
    rules: [{ kind: "forbid-attribute", attribute: "id", reason: "Container ids are regenerated on every load" }],
    referenceSolutions: [{ xpath: `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 35 },
    timeLimitSeconds: 35,
    hints: [
      "Notice the product container ids look randomly generated.",
      "Never anchor to a value that looks machine-generated.",
      "The product name inside the card is stable — use that instead.",
      `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']`,
    ],
  };
};

export const dynamicDomVariants: Variant[] = [buyButtonDynamicId];
