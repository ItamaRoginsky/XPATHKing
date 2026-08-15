import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildDirectoryScene } from "../templates/directory";
import { buildEcommerceScene } from "../templates/ecommerce";
import { descendants } from "../dom-builder";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const findAddMemberButton: Variant = (rng, difficulty) => {
  const scene = buildDirectoryScene(rng);
  const allButtons = descendants(scene.root).filter((n) => n.tag === "button");
  const distractors = allButtons.filter((n) => n.id !== scene.addButton.id).map((n) => n.id);

  return {
    difficulty,
    category: "text",
    type: "exact-target",
    template: { templateId: "directory", siteName: "TeamSpace" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [scene.addButton.id],
    distractorNodeIds: distractors,
    objective: 'Find the button labeled "Add Member".',
    flavor: "Sometimes the fastest path is the text itself.",
    rules: [],
    referenceSolutions: [
      { xpath: "//button[text()='Add Member']" },
      { xpath: "//button[contains(text(),'Add Member')]" },
      { xpath: "//button[normalize-space()='Add Member']" },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 20 },
    timeLimitSeconds: 20,
    hints: [
      "The label on the button is unique on the page.",
      "text() matches an element's exact text content.",
      "Try //button[text()='...'].",
      "//button[text()='Add Member'] locks it in one step.",
    ],
  };
};

const findSoldOutBadges: Variant = (rng, difficulty) => {
  const scene = buildEcommerceScene(rng, { productCount: 8, forceStatus: { index: 0, status: "Sold Out" } });
  const targets = scene.products.filter((p) => p.status === "Sold Out");
  const allBadges = descendants(scene.root).filter((n) => n.tag === "span" && n.attrs.class?.startsWith("badge"));
  const targetIds = targets.map((p) => p.statusNode.id);
  const distractors = allBadges.filter((n) => !targetIds.includes(n.id)).map((n) => n.id);

  return {
    difficulty,
    category: "text",
    type: "multi-match",
    template: { templateId: "ecommerce", siteName: "NovaCart" },
    html: scene.builder.render(scene.root),
    targetNodeIds: targetIds,
    distractorNodeIds: distractors,
    objective: 'Select every "Sold Out" status badge.',
    flavor: "One expression, every matching badge on the page.",
    rules: [],
    referenceSolutions: [
      { xpath: "//span[contains(@class,'badge') and text()='Sold Out']" },
      { xpath: "//span[@class='badge badge-sold-out']" },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 30 },
    timeLimitSeconds: 30,
    hints: [
      "Badges share the class 'badge' plus a status modifier.",
      "You can filter by both class and text together.",
      "Try //span[contains(@class,'badge') and text()='...'].",
      "//span[contains(@class,'badge') and text()='Sold Out'] selects every match.",
    ],
  };
};

export const textVariants: Variant[] = [findAddMemberButton, findSoldOutBadges];
