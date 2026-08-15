import type { SeededRandom } from "@xpath-arena/game-engine";
import type { Difficulty } from "@xpath-arena/shared";
import type { ChallengeDraft } from "../challenge-draft";
import { buildDirectoryScene } from "../templates/directory";

type Variant = (rng: SeededRandom, difficulty: Difficulty) => ChallengeDraft;

const deleteButtonByEmailAncestor: Variant = (rng, difficulty) => {
  const scene = buildDirectoryScene(rng);
  const target = rng.pick(scene.members);
  const allDeleteButtons = scene.members.map((m) => m.deleteButton.id);
  const distractors = allDeleteButtons.filter((id) => id !== target.deleteButton.id);

  return {
    difficulty,
    category: "axes",
    type: "relationship",
    template: { templateId: "directory", siteName: "TeamSpace" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.deleteButton.id],
    distractorNodeIds: distractors,
    objective: `Find the Delete button belonging to the member whose email is ${target.email}.`,
    flavor: "Climb up with ancestor::, then come back down.",
    rules: [],
    referenceSolutions: [
      { xpath: `//small[text()='${target.email}']/ancestor::tr//button[contains(@class,'delete')]` },
      { xpath: `//tr[.//small[text()='${target.email}']]//button[contains(@class,'delete')]` },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 40 },
    timeLimitSeconds: 40,
    hints: [
      "The email and the Delete button are in the same table row.",
      "ancestor::tr walks up from the email to its row.",
      "From the row, descend back down to the delete button.",
      `//small[text()='${target.email}']/ancestor::tr//button[contains(@class,'delete')]`,
    ],
  };
};

const roleBadgeFollowingName: Variant = (rng, difficulty) => {
  const scene = buildDirectoryScene(rng);
  const target = rng.pick(scene.members);
  const allBadges = scene.members.map((m) => m.roleNode.id);
  const distractors = allBadges.filter((id) => id !== target.roleNode.id);

  return {
    difficulty,
    category: "axes",
    type: "relationship",
    template: { templateId: "directory", siteName: "TeamSpace" },
    html: scene.builder.render(scene.root),
    targetNodeIds: [target.roleNode.id],
    distractorNodeIds: distractors,
    objective: `Find the role badge for ${target.name}.`,
    flavor: "Same row, different cell — parent:: and following-sibling:: get you there.",
    rules: [],
    referenceSolutions: [
      { xpath: `//span[@class='member-name' and text()='${target.name}']/ancestor::tr//span[contains(@class,'role-badge')]` },
      { xpath: `//tr[.//span[text()='${target.name}']]//span[contains(@class,'role-badge')]` },
    ],
    scoreConfig: { basePoints: 1000, maxSpeedBonus: 350, speedWindowSeconds: 40 },
    timeLimitSeconds: 40,
    hints: [
      "Start from the member's name.",
      "Walk up to the row that contains it with ancestor::tr.",
      "Then descend into the role badge cell.",
      `//tr[.//span[text()='${target.name}']]//span[contains(@class,'role-badge')]`,
    ],
  };
};

export const axesVariants: Variant[] = [deleteButtonByEmailAncestor, roleBadgeFollowingName];
