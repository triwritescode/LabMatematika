// Edge-of-ability difficulty (§2, §5). Keeps each problem just beyond comfort:
// nudge harder on a correct run, easier after stumbles. Never jumps levels.
import type { DifficultyBias, Performance } from "@/types";

export function adaptToEdge(perf: Performance): DifficultyBias {
  const r = perf.recent;
  const last3 = r.slice(-3);
  if (last3.length === 3 && last3.every((c) => c)) return "harder";

  const last2 = r.slice(-2);
  if (last2.length === 2 && last2.every((c) => !c)) return "easier";

  return "neutral";
}

export function emptyPerformance(): Performance {
  return { recent: [] };
}

export function pushResult(perf: Performance, correct: boolean): Performance {
  return { recent: [...perf.recent.slice(-9), correct] };
}
