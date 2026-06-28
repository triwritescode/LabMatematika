// Global progress + mastery store (§8). Zustand, hydrated from LocalStorage.
import { create } from "zustand";
import type {
  AppProgress,
  DifficultyBias,
  Level,
  Operation,
  SubSkillId,
} from "@/types";
import { LEVELS, rankForExamsPassed } from "@/lib/constants";
import { defaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { applyMasteryGain } from "@/lib/mastery";
import { nextReviewDate } from "@/lib/review";

interface ProgressState {
  progress: AppProgress;
  hydrated: boolean;

  hydrate: () => void;
  setChildName: (name: string) => void;
  /** Update one sub-skill's mastery after a single practice answer (live meter). */
  applyAnswer: (
    operation: Operation,
    level: Level,
    subSkill: SubSkillId,
    correct: boolean,
    bias: DifficultyBias,
    streak?: number,
  ) => void;
  /** Bump the daily streak for a completed session. */
  bumpStreak: (todayISO: string) => void;
  /** Mark exam passed: unlock next level + recompute rank. */
  passExam: (operation: Operation, level: Level) => void;
  setDailyMission: (operation: Operation, subSkill: SubSkillId, dateISO: string) => void;
  reset: () => void;
}

function commit(set: (p: Partial<ProgressState>) => void, next: AppProgress): void {
  saveProgress(next);
  set({ progress: next });
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: defaultProgress(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ progress: loadProgress(), hydrated: true });
  },

  setChildName: (name) => commit(set, { ...get().progress, childName: name }),

  applyAnswer: (operation, level, subSkill, correct, bias, streak = 0) => {
    const p = get().progress;
    const op = p[operation];
    const key = String(level);
    const lvl = op.levels[key];
    const prev = lvl.subSkills[subSkill] ?? {
      subSkill,
      mastery: 0,
      attempts: 0,
      lastPracticedAt: null,
    };
    const mastery = applyMasteryGain(prev.mastery, correct, bias, streak);
    const nowISO = new Date().toISOString();
    const updated = {
      ...prev,
      mastery,
      attempts: prev.attempts + 1,
      lastPracticedAt: nowISO,
      dueForReview: nextReviewDate(nowISO, correct, mastery),
    };
    commit(set, {
      ...p,
      [operation]: {
        ...op,
        levels: {
          ...op.levels,
          [key]: { ...lvl, subSkills: { ...lvl.subSkills, [subSkill]: updated } },
        },
      },
    } as AppProgress);
  },

  bumpStreak: (todayISO) => {
    const p = get().progress;
    const { lastActiveDate, count } = p.streak;
    if (lastActiveDate === todayISO) return;
    const yesterday = new Date(new Date(todayISO).getTime() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    const nextCount = lastActiveDate === yesterday ? count + 1 : 1;
    commit(set, { ...p, streak: { count: nextCount, lastActiveDate: todayISO } });
  },

  passExam: (operation, level) => {
    const p = get().progress;
    const op = p[operation];
    const key = String(level);
    const levels = {
      ...op.levels,
      [key]: { ...op.levels[key], examPassed: true },
    };
    const nextLevel = (level + 1) as Level;
    if (LEVELS.includes(nextLevel) && levels[String(nextLevel)]) {
      levels[String(nextLevel)] = { ...levels[String(nextLevel)], unlocked: true };
    }
    const passedCount = Object.values(levels).filter((l) => l.examPassed).length;
    commit(set, {
      ...p,
      [operation]: { ...op, levels, rank: rankForExamsPassed(passedCount) },
    } as AppProgress);
  },

  setDailyMission: (operation, subSkill, dateISO) => {
    const p = get().progress;
    if (p.dailyMission.date === dateISO && p.dailyMission.targetSubSkill) return;
    commit(set, {
      ...p,
      dailyMission: { date: dateISO, operation, targetSubSkill: subSkill, done: false },
    });
  },

  reset: () => commit(set, defaultProgress()),
}));
