import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Achievement, CategoryMastery, PlayerSettings, Progression, Rank } from "@xpath-arena/shared";
import type { ChallengeCategory } from "@xpath-arena/shared";
import { CATEGORY_ORDER } from "@xpath-arena/challenge-engine";

const DEFAULT_SETTINGS: PlayerSettings = {
  difficulty: "adaptive",
  roundTimerSeconds: 30,
  liveHighlighting: true,
  autocomplete: true,
  reducedMotion: false,
  fontSize: "medium",
  masterVolume: 0.7,
  musicVolume: 0.5,
  fxVolume: 0.8,
  showEvaluationDetails: false,
};

interface RoundOutcome {
  category: ChallengeCategory;
  correct: boolean;
  timeTakenMs: number;
  hintsUsed: number;
  comboAtEnd: number;
  qualityScore: number;
}

interface ProfileState {
  name: string;
  createdAt: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    challengesSolved: number;
    challengesAttempted: number;
    totalSolveTimeMs: number;
    fastestSolveMs: number | null;
    longestCombo: number;
    rating: number;
  };
  progression: Progression;
  mastery: Record<ChallengeCategory, CategoryMastery>;
  achievements: Achievement[];
  settings: PlayerSettings;
  chapterProgress: Record<ChallengeCategory, { level: number; completed: boolean }>;

  setName: (name: string) => void;
  updateSettings: (patch: Partial<PlayerSettings>) => void;
  recordRound: (outcome: RoundOutcome) => void;
  unlockAchievement: (id: string, name: string, description: string) => void;
  advanceChapter: (category: ChallengeCategory) => void;
  markTutorialComplete: () => void;
  hasTutorialCompleted: boolean;
  resetProfile: () => void;
}

function defaultMastery(): Record<ChallengeCategory, CategoryMastery> {
  const record = {} as Record<ChallengeCategory, CategoryMastery>;
  for (const category of CATEGORY_ORDER) {
    record[category] = { category, score: 0, attempts: 0, correct: 0 };
  }
  return record;
}

function defaultChapterProgress(): Record<ChallengeCategory, { level: number; completed: boolean }> {
  const record = {} as Record<ChallengeCategory, { level: number; completed: boolean }>;
  for (const category of CATEGORY_ORDER) {
    record[category] = { level: 0, completed: false };
  }
  return record;
}

export const RANKS: { rank: Rank; minRating: number }[] = [
  { rank: "DOM Rookie", minRating: 0 },
  { rank: "Node Hunter", minRating: 400 },
  { rank: "Selector", minRating: 900 },
  { rank: "DOM Tracker", minRating: 1400 },
  { rank: "XPath Specialist", minRating: 1900 },
  { rank: "DOM Assassin", minRating: 2400 },
  { rank: "XPath Master", minRating: 2900 },
  { rank: "DOM Architect", minRating: 3400 },
];

export function rankForRating(rating: number): Rank {
  let current: Rank = "DOM Rookie";
  for (const tier of RANKS) {
    if (rating >= tier.minRating) current = tier.rank;
  }
  return current;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      name: "Player",
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        challengesSolved: 0,
        challengesAttempted: 0,
        totalSolveTimeMs: 0,
        fastestSolveMs: null,
        longestCombo: 0,
        rating: 0,
      },
      progression: { chapter: 1, level: 1, xp: 0 },
      mastery: defaultMastery(),
      achievements: [],
      settings: DEFAULT_SETTINGS,
      chapterProgress: defaultChapterProgress(),
      hasTutorialCompleted: false,

      setName: (name) => set({ name }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      recordRound: (outcome) => {
        const s = get();
        const mastery = { ...s.mastery };
        const current = mastery[outcome.category];
        const attempts = current.attempts + 1;
        const correct = current.correct + (outcome.correct ? 1 : 0);
        mastery[outcome.category] = {
          ...current,
          attempts,
          correct,
          score: Math.round((correct / attempts) * 100),
        };

        const ratingDelta = outcome.correct
          ? 12 + Math.round(outcome.qualityScore / 10) + (outcome.hintsUsed === 0 ? 6 : 0)
          : -8;

        set({
          mastery,
          stats: {
            ...s.stats,
            challengesAttempted: s.stats.challengesAttempted + 1,
            challengesSolved: s.stats.challengesSolved + (outcome.correct ? 1 : 0),
            totalSolveTimeMs: s.stats.totalSolveTimeMs + (outcome.correct ? outcome.timeTakenMs : 0),
            fastestSolveMs:
              outcome.correct && (s.stats.fastestSolveMs === null || outcome.timeTakenMs < s.stats.fastestSolveMs)
                ? outcome.timeTakenMs
                : s.stats.fastestSolveMs,
            longestCombo: Math.max(s.stats.longestCombo, outcome.comboAtEnd),
            rating: Math.max(0, s.stats.rating + ratingDelta),
          },
        });
      },

      unlockAchievement: (id, name, description) => {
        const s = get();
        if (s.achievements.some((a) => a.id === id)) return;
        set({ achievements: [...s.achievements, { id, name, description, unlockedAt: new Date().toISOString() }] });
      },

      advanceChapter: (category) => {
        const s = get();
        const progress = { ...s.chapterProgress };
        progress[category] = { level: progress[category].level + 1, completed: true };
        set({ chapterProgress: progress });
      },

      markTutorialComplete: () => set({ hasTutorialCompleted: true }),

      resetProfile: () =>
        set({
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            challengesSolved: 0,
            challengesAttempted: 0,
            totalSolveTimeMs: 0,
            fastestSolveMs: null,
            longestCombo: 0,
            rating: 0,
          },
          progression: { chapter: 1, level: 1, xp: 0 },
          mastery: defaultMastery(),
          achievements: [],
          chapterProgress: defaultChapterProgress(),
          hasTutorialCompleted: false,
        }),
    }),
    { name: "xpath-arena-profile" },
  ),
);
