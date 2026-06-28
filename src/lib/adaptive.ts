// Adaptive difficulty within a level — productive struggle zone (§5).
// Never jumps levels; only biases operand ranges inside the chosen level.
import type { DifficultyBias, Performance } from "@/types";

/**
 * Derive a difficulty bias from recent results:
 *   3 correct in a row → "harder"
 *   2 wrong in a row    → "easier"
 *   otherwise           → "neutral"
 */
export function adaptDifficulty(perf: Performance): DifficultyBias {
  const r = perf.recent;
  const last3 = r.slice(-3);
  if (last3.length === 3 && last3.every((c) => c)) return "harder";

  const last2 = r.slice(-2);
  if (last2.length === 2 && last2.every((c) => !c)) return "easier";

  return "neutral";
}

export function emptyPerformance(): Performance {
  return { recent: [], subSkillMisses: {} };
}
