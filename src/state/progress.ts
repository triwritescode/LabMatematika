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

type ProgressState = {
  childName: string;
  labs: Record<Operation, LabProgress>;
  streak: { count: number; lastActiveDate: string };
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
          const { count, lastActiveDate } = state.streak;
          if (lastActiveDate === today) return state;
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          const nextCount = lastActiveDate === yesterday ? count + 1 : 1;
          return { streak: { count: nextCount, lastActiveDate: today } };
        }),
    }),
    {
      name: 'labmatematika-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export { LABS };
