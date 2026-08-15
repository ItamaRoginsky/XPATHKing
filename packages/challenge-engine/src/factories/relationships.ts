import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildEcommerceScene } from "../templates/ecommerce";
import { buildFormScene } from "../templates/form";
import { descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const priceByProductName: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng);
  const target = rng.pick(scene.products);
  const allPrices = descendants(scene.root).filter((n) => n.tag === "span" && n.attrs.class === "price");
  const distractors = allPrices.filter((n) => n.id !== target.priceNode.id).map((n) => n.id);

  return {
    difficulty,
    category: "relationships",
    type: "relationship",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.priceNode.id],
    distractorNodeIds: distractors,
    objective: `Find the price belonging to "${target.name}".`,
    flavor: "The price alone means nothing — it needs its product.",
    rules: [],
    referenceSolutions: [
      { xpath: `//article[.//h3[text()='${target.name}']]//span[@class='price']` },
      { xpath: `//h3[text()='${target.name}']/following-sibling::span[@class='price']` },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 35 },
    timeLimitSeconds: 35,
    hints: [
      "First locate the product card by its name.",
      "Then search inside that card for the price.",
      "A predicate like [.//h3[text()='...']] filters by descendant content.",
      `//article[.//h3[text()='${target.name}']]//span[@class='price']`,
    ],
  };
};

const buyButtonByProductName: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng);
  const eligible = scene.products.filter((p) => p.status !== "Sold Out");
  const target = rng.pick(eligible.length > 0 ? eligible : scene.products);
  const allBuyButtons = scene.products.map((p) => p.buyButton.id);
  const distractors = allBuyButtons.filter((id) => id !== target.buyButton.id);

  return {
    difficulty,
    category: "relationships",
    type: "relationship",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.buyButton.id],
    distractorNodeIds: distractors,
    objective: `Find the Buy Now button belonging to "${target.name}".`,
    flavor: "Every button looks the same. Context makes it unique.",
    rules: [],
    referenceSolutions: [{ xpath: `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "Buy buttons are identical except for their container.",
      "Anchor on the product name, then descend into the button.",
      "//article[.//h3[text()='...']]//button works for any container that has that heading.",
      `//article[.//h3[text()='${target.name}']]//button[@data-action='buy']`,
    ],
  };
};

const inputAfterLabel: Variant = (rng, difficulty) => {
  const scene = buildFormScene(rng);
  const target = rng.pick(scene.fields);
  const allInputs = descendants(scene.root).filter((n) => n.tag === "input");
  const distractors = allInputs.filter((n) => n.id !== target.input.id).map((n) => n.id);

  return {
    difficulty,
    category: "relationships",
    type: "relationship",
    template: { templateId: "form", siteName: "NovaCart Account" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.input.id],
    distractorNodeIds: distractors,
    objective: `Find the input immediately following the label "${target.labelText}".`,
    flavor: "Labels and inputs are siblings — use that.",
    rules: [],
    referenceSolutions: [
      { xpath: `//label[text()='${target.labelText}']/following-sibling::input[1]` },
      { xpath: `//label[text()='${target.labelText}']/../input` },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 35 },
    timeLimitSeconds: 35,
    hints: [
      "The label and its input share a parent <div>.",
      "following-sibling:: moves from the label to elements after it.",
      "Try //label[text()='...']/following-sibling::input.",
      `//label[text()='${target.labelText}']/following-sibling::input[1]`,
    ],
  };
};

export const relationshipsVariants: Variant[] = [priceByProductName, buyButtonByProductName, inputAfterLabel];
