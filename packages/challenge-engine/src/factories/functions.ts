import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildDirectoryScene } from "../templates/directory";
import { buildEcommerceScene } from "../templates/ecommerce";
import { DomBuilder, descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const containsEmail: Variant = (rng, difficulty) => {
  const scene = buildDirectoryScene(rng);
  const target = rng.pick(scene.members);
  // Full local-part (e.g. "sarah.cohen") is guaranteed unique since member
  // full names are deduped at scene-build time — a first-name-only fragment
  // is not, since two members can share a first name.
  const fragment = target.email.split("@")[0]!;
  const allEmails = scene.members.map((m) => m.emailNode.id);
  const distractors = allEmails.filter((id) => id !== target.emailNode.id);

  return {
    difficulty,
    category: "functions",
    type: "exact-target",
    template: { templateId: "directory", siteName: "TeamSpace" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.emailNode.id],
    distractorNodeIds: distractors,
    objective: `Find the member whose email contains "${fragment}".`,
    flavor: "You don't always know the full value — contains() doesn't need it.",
    rules: [],
    referenceSolutions: [{ xpath: `//small[contains(text(),'${fragment}')]` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [
      "You only know part of the email address.",
      "contains(text(), '...') matches a substring.",
      `Try //small[contains(text(),'${fragment}')].`,
      `//small[contains(text(),'${fragment}')]`,
    ],
  };
};

const lastProductInCategory: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng, { productCount: 6 });
  const byCategory = new Map<string, typeof scene.products>();
  for (const p of scene.products) {
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }
  const multiProduct = [...byCategory.entries()].filter(([, arr]) => arr.length >= 2);
  const [category, products] = multiProduct.length > 0 ? rng.pick(multiProduct) : [...byCategory.entries()][0]!;
  const target = products[products.length - 1]!;
  const allCards = descendants(scene.root).filter((n) => n.tag === "article");
  const distractors = allCards.filter((n) => n.id !== target.node.id).map((n) => n.id);

  return {
    difficulty,
    category: "functions",
    type: "exact-target",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.node.id],
    distractorNodeIds: distractors,
    objective: `Find the last product listed under "${category}".`,
    flavor: "last() picks the final item in a matched set.",
    rules: [],
    referenceSolutions: [{ xpath: `//section[@data-category='${category}']//article[last()]` }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "Scope your search to the right category section first.",
      "last() refers to the last node in the current match set.",
      `Try //section[@data-category='${category}']//article[last()].`,
      `//section[@data-category='${category}']//article[last()]`,
    ],
  };
};

const normalizeSpaceButton: Variant = (_rng, difficulty) => {
  const b = new DomBuilder();
  const messyButton = b.el("button", { class: "btn btn-primary", type: "button" }, ["   Confirm   Order   "]);
  const cleanButton1 = b.el("button", { class: "btn", type: "button" }, ["Cancel"]);
  const cleanButton2 = b.el("button", { class: "btn", type: "button" }, ["Save Draft"]);
  const root = b.el("div", { class: "checkout-actions" }, [messyButton, cleanButton1, cleanButton2]);

  return {
    difficulty,
    category: "functions",
    type: "exact-target",
    template: { templateId: "checkout", siteName: "NovaCart Checkout" },
    html: b.render(root),
    targetNodeIds: [messyButton.id],
    distractorNodeIds: [cleanButton1.id, cleanButton2.id],
    objective: 'Find the button whose visible text reads "Confirm Order".',
    flavor: "Real markup has stray whitespace. normalize-space() cleans it up.",
    rules: [],
    referenceSolutions: [{ xpath: "//button[normalize-space()='Confirm Order']" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [
      "The raw text has extra spaces and line breaks around it.",
      "text() would need an exact match, whitespace included — normalize-space() doesn't.",
      "Try //button[normalize-space()='Confirm Order'].",
      "//button[normalize-space()='Confirm Order']",
    ],
  };
};

export const functionsVariants: Variant[] = [containsEmail, lastProductInCategory, normalizeSpaceButton];
