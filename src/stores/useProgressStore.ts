// Global progress + rewards store (§7). Zustand, hydrated from LocalStorage.
// SSR-safe: starts from defaults, hydrate() runs on the client after mount.
import { create } from "zustand";
import type { AppProgress, SessionResult } from "@/types";
import { defaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { applySessionResult, updateStreak } from "@/lib/rewards";

interface ProgressState {
  progress: AppProgress;
  hydrated: boolean;

  hydrate: () => void;
  setChildName: (name: string) => void;
  recordSession: (result: SessionResult) => void;
  spendCoins: (amount: number, itemId: string) => boolean;
  reset: () => void;
}

/** Mutate progress, persist, and update state in one place. */
function commit(
  set: (partial: Partial<ProgressState>) => void,
  next: AppProgress,
): void {
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

  setChildName: (name) => {
    commit(set, { ...get().progress, childName: name });
  },

  recordSession: (result) => {
    const today = new Date().toISOString().slice(0, 10);
    let next = applySessionResult(get().progress, result);
    next = updateStreak(next, today);
    commit(set, next);
  },

  spendCoins: (amount, itemId) => {
    const p = get().progress;
    if (p.rewards.coins < amount) return false;
    commit(set, {
      ...p,
      rewards: {
        ...p.rewards,
        coins: p.rewards.coins - amount,
        ownedItems: [...new Set([...p.rewards.ownedItems, itemId])],
      },
    });
    return true;
  },

  reset: () => commit(set, defaultProgress()),
}));
