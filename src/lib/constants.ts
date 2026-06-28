// App-wide constants. See specs §3, §12, §15.
import type { Operation, Level, Mode } from "@/types";

export const QUESTIONS_PER_SESSION = 10;
export const POINTS_PER_CORRECT = 10;
export const COINS_PER_CORRECT = 10;
export const CHALLENGE_UNLOCK_THRESHOLD = 7; // score >= 7/10 unlocks next level

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5] as const;

export const OPERATIONS: readonly Operation[] = [
  "add",
  "subtract",
  "multiply",
  "divide",
] as const;

export const MODES: readonly Mode[] = ["latihan", "tantangan", "campur"] as const;

interface OperationMeta {
  id: Operation;
  /** Bahasa Indonesia label. */
  label: string;
  symbol: string;
  emoji: string;
  /** "World" color — Tailwind-friendly hex (§15). */
  color: string;
}

export const OPERATION_META: Record<Operation, OperationMeta> = {
  add: { id: "add", label: "Tambah", symbol: "+", emoji: "➕", color: "#3B82F6" },
  subtract: { id: "subtract", label: "Kurang", symbol: "−", emoji: "➖", color: "#EF4444" },
  multiply: { id: "multiply", label: "Kali", symbol: "×", emoji: "✖️", color: "#22C55E" },
  divide: { id: "divide", label: "Bagi", symbol: "÷", emoji: "➗", color: "#EAB308" },
};

/** Stars by score (§10.5): 9–10 → 3, 7–8 → 2, 5–6 → 1, <5 → 0. */
export function starsForScore(score: number): 0 | 1 | 2 | 3 {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

export const STORAGE_KEY = "labmatematika:progress:v1";
