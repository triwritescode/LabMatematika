// Domain types for LabMatematika. Single source of truth — see specs §3, §11, §13.

// ── Core domain ────────────────────────────────────────────────────────────

export type Operation = "add" | "subtract" | "multiply" | "divide";

/** Difficulty level within an operation. 1 = single digit … 5 = mixed/challenge. */
export type Level = 1 | 2 | 3 | 4 | 5;

export type Mode = "latihan" | "tantangan" | "campur";

/** Sub-skill tracked for "Perlu latihan" weak-spot detection (§6, §13). */
export type SubSkill = "carrying" | "borrowing";

// ── Questions ──────────────────────────────────────────────────────────────

export interface Question {
  /** Stable id, unique within a session (no duplicates per session — §11). */
  id: string;
  a: number;
  b: number;
  operation: Operation;
  level: Level;
  answer: number;
  /** Present only when the operands exercise a tracked sub-skill. */
  subSkill?: SubSkill;
}

/** One answered question, retained for scoring + end-of-session review (§6). */
export interface AnsweredQuestion {
  question: Question;
  /** What the child typed. `null` if skipped. */
  given: number | null;
  correct: boolean;
}

/** Difficulty bias derived from recent performance (§5). */
export type DifficultyBias = "easier" | "neutral" | "harder";

/** Rolling window of recent results feeding adaptive difficulty (§5). */
export interface Performance {
  /** Most-recent-last booleans, correct/incorrect. */
  recent: boolean[];
  /** Per-sub-skill correct/total seen so far this session. */
  subSkillMisses: Partial<Record<SubSkill, { correct: number; total: number }>>;
}

// ── Persistence (§13) ────────────────────────────────────────────────────────

export interface SubSkillStat {
  correct: number;
  total: number;
}

export type SubSkillStats = Partial<Record<SubSkill, SubSkillStat>>;

export interface LevelProgress {
  unlocked: boolean;
  bestScore: number;
  bestStars: number;
  attempts: number;
  /** ISO timestamp, or null if never played. */
  lastPlayedAt: string | null;
}

export interface OperationProgress {
  /** Keyed by level number as string ("1".."5"). */
  levels: Record<string, LevelProgress>;
  subSkills: SubSkillStats;
}

export interface Rewards {
  coins: number;
  ownedItems: string[];
  stickers: string[];
  badges: string[];
  equippedItems: { hat?: string; theme?: string };
}

export interface Streak {
  count: number;
  /** ISO date (yyyy-mm-dd) of last active day. */
  lastActiveDate: string | null;
}

export interface DailyMission {
  /** ISO date (yyyy-mm-dd) the mission belongs to. */
  date: string;
  done: boolean;
}

export interface AppProgress {
  childName: string;
  add: OperationProgress;
  subtract: OperationProgress;
  multiply: OperationProgress;
  divide: OperationProgress;
  streak: Streak;
  dailyMission: DailyMission;
  rewards: Rewards;
}

// ── Session + results ────────────────────────────────────────────────────────

export interface SessionResult {
  operation: Operation;
  level: Level;
  mode: Mode;
  score: number; // 0..10 correct
  stars: 0 | 1 | 2 | 3;
  coinsEarned: number;
  unlockedNextLevel: boolean;
  newBadges: string[];
  mistakes: AnsweredQuestion[];
}
