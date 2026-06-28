// LocalStorage persistence with SSR-safe guards + schema defaults (§13).
// No account, no cloud — one device = one child. Treats persisted data as
// untrusted: a structurally validated revive prevents corrupt/old saves from
// crashing the app and keeps new sub-skills forward-compatible.
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

// ── Validated revive (untrusted persisted input) ─────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;
const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback;
const str = (v: unknown, fallback: string | null): string | null =>
  typeof v === "string" ? v : fallback;
const clampMastery = (v: unknown): number => Math.max(0, Math.min(100, num(v, 0)));

function reviveMastery(def: SubSkillMastery, stored: unknown): SubSkillMastery {
  if (!isObj(stored)) return def;
  const out: SubSkillMastery = {
    subSkill: def.subSkill,
    mastery: clampMastery(stored.mastery),
    attempts: Math.max(0, Math.floor(num(stored.attempts, 0))),
    lastPracticedAt: str(stored.lastPracticedAt, null),
  };
  const due = str(stored.dueForReview, null);
  if (due) out.dueForReview = due;
  return out;
}

function reviveLevel(def: LevelState, stored: unknown): LevelState {
  if (!isObj(stored)) return def;
  const storedSubs = isObj(stored.subSkills) ? stored.subSkills : {};
  const subSkills: Record<string, SubSkillMastery> = {};
  // Drive from defaults so newly-added sub-skills always exist; overlay stored data.
  for (const [id, defMastery] of Object.entries(def.subSkills)) {
    subSkills[id] = reviveMastery(defMastery, storedSubs[id]);
  }
  return {
    unlocked: bool(stored.unlocked, def.unlocked),
    examPassed: bool(stored.examPassed, def.examPassed),
    subSkills,
  };
}

function reviveOperation(def: OperationProgress, stored: unknown): OperationProgress {
  if (!isObj(stored)) return def;
  const storedLevels = isObj(stored.levels) ? stored.levels : {};
  const levels: OperationProgress["levels"] = {};
  for (const [key, defLevel] of Object.entries(def.levels)) {
    levels[key] = reviveLevel(defLevel, storedLevels[key]);
  }
  return { rank: str(stored.rank, def.rank) ?? def.rank, levels };
}

function reviveProgress(raw: unknown): AppProgress {
  const def = defaultProgress();
  if (!isObj(raw)) return def;

  const out: AppProgress = { ...def };
  out.childName = str(raw.childName, "") ?? "";
  for (const op of OPERATIONS) out[op] = reviveOperation(def[op], raw[op]);

  if (isObj(raw.streak)) {
    out.streak = {
      count: Math.max(0, Math.floor(num(raw.streak.count, 0))),
      lastActiveDate: str(raw.streak.lastActiveDate, null),
    };
  }
  if (isObj(raw.dailyMission)) {
    const m = raw.dailyMission;
    out.dailyMission = {
      date: str(m.date, "") ?? "",
      operation: (OPERATIONS as readonly string[]).includes(m.operation as string)
        ? (m.operation as Operation)
        : null,
      targetSubSkill: str(m.targetSubSkill, null),
      done: bool(m.done, false),
    };
  }
  return out;
}

// ── Storage I/O ──────────────────────────────────────────────────────────────

const isBrowser = typeof window !== "undefined";

export function loadProgress(): AppProgress {
  if (!isBrowser) return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    return reviveProgress(JSON.parse(raw));
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
