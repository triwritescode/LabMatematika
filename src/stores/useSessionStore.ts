// Ephemeral store for the just-finished session, read by /quiz/result + /quiz/review.
// Not persisted — it only needs to survive the in-app navigation after a quiz.
import { create } from "zustand";
import type { SessionResult } from "@/types";

interface SessionState {
  result: SessionResult | null;
  setResult: (result: SessionResult) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clear: () => set({ result: null }),
}));
