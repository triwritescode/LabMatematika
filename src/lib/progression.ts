// Small helpers tying progress state to the deliberate-practice loop (§6).
import type { Level, OperationProgress } from "@/types";
import { LEVELS } from "@/lib/constants";

/** The level the kid is currently working on: lowest unlocked, not-yet-passed level. */
export function activeLevel(op: OperationProgress): Level {
  for (const lvl of LEVELS) {
    const s = op.levels[String(lvl)];
    if (s.unlocked && !s.examPassed) return lvl;
  }
  // All passed → stay on the last level.
  return 5;
}
