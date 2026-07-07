import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clampMastery, masteryDelta, rankFor } from '@/curriculum/mastery';
import { LabProgress, Operation } from '@/curriculum/types';

// Local-first progress store. AsyncStorage today; the storage adapter is the
// single swap point for MMKV (+ Legend-State sync) in Phase 3.

const LABS: Operation[] = ['add', 'sub', 'mul', 'div'];

function emptyLab(lab: Operation): LabProgress {
  return {
    lab,
    rank: rankFor(lab, []),
    placementDone: false,
    tingkatPassed: [],
    levels: {},
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// UTC-safe day shift so all streak math uses the same calendar convention as
// todayISO() (which is UTC via toISOString).
export function shiftISO(iso: string, deltaDays: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + deltaDays * 86400000)
    .toISOString()
    .slice(0, 10);
}

// Duolingo-style: the streak is the run of consecutive practiced days ending
// today or yesterday. Missing a full day breaks it back to 0. Deriving from the
// day-history (instead of a stored counter) means the displayed streak is always
// correct on app open, even after days away without practice.
export function computeStreak(activeDates: string[], today = todayISO()): number {
  const set = new Set(activeDates);
  const yesterday = shiftISO(today, -1);
  if (!set.has(today) && !set.has(yesterday)) return 0;
  let cursor = set.has(today) ? today : yesterday;
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = shiftISO(cursor, -1);
  }
  return count;
}

type ProgressState = {
  childName: string;
  labs: Record<Operation, LabProgress>;
  streak: { count: number; lastActiveDate: string };
  // Every day (ISO yyyy-mm-dd, UTC) the user completed a practice/exam session.
  // Source of truth for both the streak count and the calendar widget.
  activeDates: string[];
  diamonds: number;
  setChildName: (name: string) => void;
  recordAnswer: (lab: Operation, levelId: string, correct: boolean, diff: number, streak: number) => void;
  passTingkat: (lab: Operation, tingkat: number) => void;
  touchStreak: () => void;
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      childName: '',
      labs: {
        add: emptyLab('add'),
        sub: emptyLab('sub'),
        mul: emptyLab('mul'),
        div: emptyLab('div'),
      },
      streak: { count: 0, lastActiveDate: '' },
      activeDates: [],
      diamonds: 0,

      setChildName: (name) => set({ childName: name.trim() }),

      recordAnswer: (lab, levelId, correct, diff, streak) =>
        set((state) => {
          const labProgress = state.labs[lab];
          const prev = labProgress.levels[levelId];
          const mastery = clampMastery(
            (prev?.mastery ?? 0) + masteryDelta(correct, diff, streak)
          );
          return {
            labs: {
              ...state.labs,
              [lab]: {
                ...labProgress,
                levels: {
                  ...labProgress.levels,
                  [levelId]: {
                    levelId,
                    mastery,
                    attempts: (prev?.attempts ?? 0) + 1,
                    lastPracticedAt: new Date().toISOString(),
                  },
                },
              },
            },
          };
        }),

      passTingkat: (lab, tingkat) =>
        set((state) => {
          const labProgress = state.labs[lab];
          if (labProgress.tingkatPassed.includes(tingkat)) return state;
          const tingkatPassed = [...labProgress.tingkatPassed, tingkat].sort();
          return {
            labs: {
              ...state.labs,
              [lab]: { ...labProgress, tingkatPassed, rank: rankFor(lab, tingkatPassed) },
            },
          };
        }),

      touchStreak: () =>
        set((state) => {
          const today = todayISO();
          // Guard on activeDates (the source of truth), not lastActiveDate.
          // Guarding on lastActiveDate could early-return while activeDates is
          // still missing today (e.g. migrated state), leaving the streak/
          // calendar stuck at 0 for the rest of the day.
          if (state.activeDates.includes(today)) return state;
          const activeDates = [...state.activeDates, today];
          const count = computeStreak(activeDates, today);
          return { activeDates, streak: { count, lastActiveDate: today } };
        }),
    }),
    {
      name: 'labmatematika-progress',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 → v1: seed the day-history from the last recorded active day so
      // existing users keep their current streak instead of resetting to 0.
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted && !persisted.activeDates) {
          const last: string | undefined = persisted?.streak?.lastActiveDate;
          persisted.activeDates = last ? [last] : [];
        }
        return persisted;
      },
    }
  )
);

// Live streak for display — derived from day-history so it self-heals on app
// open (e.g. reads 0 the day after a missed day, without needing a practice).
export function useCurrentStreak(): number {
  return useProgress((s) => computeStreak(s.activeDates));
}

export { LABS };
