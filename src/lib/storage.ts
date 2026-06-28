// LocalStorage persistence with SSR-safe guards + schema defaults (§13).
// No account, no cloud — one device = one child.
import type { AppProgress, Operation, OperationProgress } from "@/types";
import { LEVELS, OPERATIONS, STORAGE_KEY } from "@/lib/constants";

function emptyOperationProgress(): OperationProgress {
  const levels: OperationProgress["levels"] = {};
  for (const lvl of LEVELS) {
    levels[String(lvl)] = {
      unlocked: lvl === 1, // only Level 1 starts unlocked
      bestScore: 0,
      bestStars: 0,
      attempts: 0,
      lastPlayedAt: null,
    };
  }
  return { levels, subSkills: {} };
}

export function defaultProgress(): AppProgress {
  const byOp = Object.fromEntries(
    OPERATIONS.map((op) => [op, emptyOperationProgress()]),
  ) as Record<Operation, OperationProgress>;

  return {
    childName: "",
    add: byOp.add,
    subtract: byOp.subtract,
    multiply: byOp.multiply,
    divide: byOp.divide,
    streak: { count: 0, lastActiveDate: null },
    dailyMission: { date: "", done: false },
    rewards: {
      coins: 0,
      ownedItems: [],
      stickers: [],
      badges: [],
      equippedItems: {},
    },
  };
}

const isBrowser = typeof window !== "undefined";

export function loadProgress(): AppProgress {
  if (!isBrowser) return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    // Shallow-merge over defaults so new fields survive schema growth.
    return { ...defaultProgress(), ...(JSON.parse(raw) as Partial<AppProgress>) };
  } catch {
    // Corrupt/unavailable storage must never crash the app — start fresh.
    return defaultProgress();
  }
}

export function saveProgress(progress: AppProgress): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Quota / private-mode failures are non-fatal; progress stays in memory.
  }
}

export function clearProgress(): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
