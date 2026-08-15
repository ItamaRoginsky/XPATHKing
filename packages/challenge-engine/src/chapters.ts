import type { ChallengeCategory, Difficulty } from "@xpath-arena/shared";

export interface Chapter {
  number: number;
  id: ChallengeCategory;
  title: string;
  subtitle: string;
  teaches: string[];
  difficulty: Difficulty;
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    id: "basics",
    title: "XPath Rookie",
    subtitle: "Tags, ids, and your first selectors",
    teaches: ["//div", "//button", "//*[@id='login']"],
    difficulty: "beginner",
  },
  {
    number: 2,
    id: "attributes",
    title: "Attributes",
    subtitle: "Fingerprint elements with their attributes",
    teaches: ["//input[@name='email']", "//button[@type='submit']"],
    difficulty: "beginner",
  },
  {
    number: 3,
    id: "text",
    title: "Text",
    subtitle: "Match on what the user actually sees",
    teaches: ["//button[text()='Login']", "//*[normalize-space()='Settings']"],
    difficulty: "intermediate",
  },
  {
    number: 4,
    id: "relationships",
    title: "Relationships",
    subtitle: "Find one element through another",
    teaches: ["//div/span", "//div//span"],
    difficulty: "intermediate",
  },
  {
    number: 5,
    id: "conditions",
    title: "Conditions",
    subtitle: "Combine predicates to narrow the match",
    teaches: ["//input[@type='text' and @required]"],
    difficulty: "intermediate",
  },
  {
    number: 6,
    id: "axes",
    title: "Axes",
    subtitle: "Move through the tree in any direction",
    teaches: ["following-sibling::", "ancestor::", "parent::"],
    difficulty: "advanced",
  },
  {
    number: 7,
    id: "functions",
    title: "Functions",
    subtitle: "contains, starts-with, normalize-space, last",
    teaches: ["contains()", "starts-with()", "normalize-space()", "last()"],
    difficulty: "advanced",
  },
  {
    number: 8,
    id: "real-world",
    title: "Real World",
    subtitle: "Messy, believable, production-grade DOMs",
    teaches: ["Composing everything you've learned so far"],
    difficulty: "advanced",
  },
  {
    number: 9,
    id: "dynamic-dom",
    title: "Dynamic DOM",
    subtitle: "Avoid generated ids and brittle structure",
    teaches: ["Recognizing generated identifiers", "Stable anchoring"],
    difficulty: "expert",
  },
  {
    number: 10,
    id: "mastery",
    title: "XPath Master",
    subtitle: "Boss DOMs. No shortcuts.",
    teaches: ["Everything, combined, under pressure"],
    difficulty: "expert",
  },
];

export function chapterFor(category: ChallengeCategory): Chapter {
  const chapter = CHAPTERS.find((c) => c.id === category);
  if (!chapter) throw new Error(`No chapter for category ${category}`);
  return chapter;
}
