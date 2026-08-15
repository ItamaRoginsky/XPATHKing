import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildEcommerceScene } from "../templates/ecommerce";
import { descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const findLoginButton: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng);
  const allButtons = descendants(scene.root).filter((n) => n.tag === "button");
  const distractors = allButtons.filter((n) => n.id !== scene.loginButton.id).map((n) => n.id);

  return {
    difficulty,
    category: "basics",
    type: "exact-target",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [scene.loginButton.id],
    distractorNodeIds: distractors,
    objective: "Find the Login button.",
    flavor: "Every hunt starts with a single element. Just point at it.",
    rules: [],
    referenceSolutions: [
      { xpath: "//button[@id='login-btn']" },
      { xpath: "//*[@id='login-btn']" },
      { xpath: "//header//button[text()='Login']" },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 25 },
    timeLimitSeconds: 25,
    hints: [
      "Look at the top-right of the page.",
      "Every element has a tag name — this one is a <button>.",
      "Try //button first, then narrow it down with an attribute.",
      "//button[@id='login-btn'] selects it directly.",
    ],
  };
};

const findAllNavLinks: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng);
  const allLinks = descendants(scene.root).filter((n) => n.tag === "a");
  const targetIds = scene.navLinks.map((n) => n.id);
  const distractors = allLinks.filter((n) => !targetIds.includes(n.id)).map((n) => n.id);

  return {
    difficulty,
    category: "basics",
    type: "multi-match",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: targetIds,
    distractorNodeIds: distractors,
    objective: "Select every navigation link in the header (Home, Deals, Support).",
    flavor: "Not every target is one element. Sometimes you need the whole set.",
    rules: [],
    referenceSolutions: [{ xpath: "//nav[@class='nav-links']/a" }, { xpath: "//nav//a" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "These links live inside a <nav> element.",
      "A single step from nav to its children keeps the footer links out.",
      "//nav/a selects direct children only.",
      "//nav[@class='nav-links']/a is unambiguous.",
    ],
  };
};

const findSearchInput: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng);
  const allInputs = descendants(scene.root).filter((n) => n.tag === "input");
  const distractors = allInputs.filter((n) => n.id !== scene.searchInput.id).map((n) => n.id);

  return {
    difficulty,
    category: "basics",
    type: "exact-target",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [scene.searchInput.id],
    distractorNodeIds: distractors,
    objective: "Find the product search input.",
    flavor: "One tag, one job.",
    rules: [],
    referenceSolutions: [{ xpath: "//input[@name='search']" }, { xpath: "//input[@class='search-input']" }],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 20 },
    timeLimitSeconds: 20,
    hints: [
      "It's the text field in the header.",
      "Inputs are matched with //input.",
      "Narrow it down with its name attribute.",
      "//input[@name='search'] is a clean, unique match.",
    ],
  };
};

export const basicsVariants: Variant[] = [findLoginButton, findAllNavLinks, findSearchInput];
