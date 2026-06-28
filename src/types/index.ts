// Domain types for LabMatematika — deliberate-practice model. See specs §4, §5, §11, §13.

// ── Core domain ────────────────────────────────────────────────────────────

export type Operation = "add" | "subtract" | "multiply" | "divide";

/** Difficulty level within an operation. 1 = single digit … 5 = mixed/challenge. */
export type Level = 1 | 2 | 3 | 4 | 5;

/** Stable sub-skill id, e.g. "add.carry-single" (§4). The unit practice targets. */
export type SubSkillId = string;

/** The three modes (§3). */
export type SessionMode = "diagnostic" | "practice" | "exam";

/** Difficulty bias from recent performance — edge of ability (§5). */
export type DifficultyBias = "easier" | "neutral" | "harder";

// ── Questions ──────────────────────────────────────────────────────────────

export interface Question {
  /** Unique within a session. */
  id: string;
  a: number;
  b: number;
  operation: Operation;
  level: Level;
  /** Which sub-skill this problem exercises (§11). */
  subSkill: SubSkillId;
  answer: number;
}

/** One answered question, retained for scoring + review (§6). */
export interface AnsweredQuestion {
  question: Question;
  /** What the child typed. `null` if skipped. */
  given: number | null;
  correct: boolean;
}

/** Rolling window of recent results feeding adaptive difficulty (§5). */
export interface Performance {
  /** Most-recent-last booleans, correct/incorrect. */
  recent: boolean[];
}

// ── Persistence (§13) ────────────────────────────────────────────────────────

export interface SubSkillMastery {
  subSkill: SubSkillId;
  /** 0–100. */
  mastery: number;
  attempts: number;
  /** ISO timestamp, or null if never practiced. */
  lastPracticedAt: string | null;
  /** ISO date the item is next due in spaced review (§7, review.ts). */
  dueForReview?: string;
}

export interface LevelState {
  unlocked: boolean;
  examPassed: boolean;
  /** Mastery per sub-skill assigned to this level. */
  subSkills: Record<SubSkillId, SubSkillMastery>;
}

export interface OperationProgress {
  /** Rank label earned in this operation (§7, §17 ladder). */
  rank: string;
  /** Keyed by level number as string ("1".."5"). */
  levels: Record<string, LevelState>;
}

export interface Streak {
  count: number;
  /** ISO date (yyyy-mm-dd) of last active day. */
  lastActiveDate: string | null;
}

export interface DailyMission {
  /** ISO date (yyyy-mm-dd) the mission belongs to. */
  date: string;
  operation: Operation | null;
  targetSubSkill: SubSkillId | null;
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
}

// ── Session outcomes (carried quiz → result/review) ──────────────────────────

/** Practice session summary. */
export interface PracticeResult {
  kind: "practice";
  operation: Operation;
  level: Level;
  targetSubSkill: SubSkillId;
  correct: number;
  total: number;
  /** Mastery before/after for the target, for the "meter went up" moment. */
  masteryBefore: number;
  masteryAfter: number;
  mistakes: AnsweredQuestion[];
}

/** Level-Up Exam verdict (§3.3, §12). */
export interface ExamResult {
  kind: "exam";
  operation: Operation;
  level: Level;
  correct: number;
  total: number;
  passed: boolean;
  /** On pass: newly unlocked next level + rank earned. */
  newRank?: string;
  /** On fail: the sub-skill to route back to (§3.3). */
  failingSubSkill?: SubSkillId;
  mistakes: AnsweredQuestion[];
}

export type SessionResult = PracticeResult | ExamResult;
