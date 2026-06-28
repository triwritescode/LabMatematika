// LocalStorage persistence with SSR-safe guards + schema defaults (§13).
// No account, no cloud — one device = one child.
import type {
  AppProgress,
  LevelState,
  Operation,
  OperationProgress,
  SubSkillMastery,
} from "@/types";
import { LEVELS, OPERATIONS, RANK_LADDER, STORAGE_KEY } from "@/lib/constants";
import { levelSubSkills } from "@/lib/subskills";

function emptyMastery(subSkill: string): SubSkillMastery {
  return { subSkill, mastery: 0, attempts: 0, lastPracticedAt: null };
}

function emptyLevelState(operation: Operation, level: (typeof LEVELS)[number]): LevelState {
  const subSkills: Record<string, SubSkillMastery> = {};
  for (const id of levelSubSkills(operation, level)) subSkills[id] = emptyMastery(id);
  return { unlocked: level === 1, examPassed: false, subSkills };
}

function emptyOperationProgress(operation: Operation): OperationProgress {
  const levels: OperationProgress["levels"] = {};
  for (const lvl of LEVELS) levels[String(lvl)] = emptyLevelState(operation, lvl);
  return { rank: RANK_LADDER[0], levels };
}

export function defaultProgress(): AppProgress {
  const byOp = Object.fromEntries(
    OPERATIONS.map((op) => [op, emptyOperationProgress(op)]),
  ) as Record<Operation, OperationProgress>;

  return {
    childName: "",
    add: byOp.add,
    subtract: byOp.subtract,
    multiply: byOp.multiply,
    divide: byOp.divide,
    streak: { count: 0, lastActiveDate: null },
    dailyMission: { date: "", operation: null, targetSubSkill: null, done: false },
  };
}

const isBrowser = typeof window !== "undefined";

export function loadProgress(): AppProgress {
  if (!isBrowser) return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...(JSON.parse(raw) as Partial<AppProgress>) };
  } catch {
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
