// Edge-of-ability difficulty dial (specs §3): magnitude adapts *inside* a
// level. Correct streaks push diff up; misses pull it down.

export function initialDiff(mastery: number): number {
  // Start near the child's demonstrated level, never at the extremes.
  return clamp(0.15 + (mastery / 100) * 0.7);
}

export function nextDiff(diff: number, correct: boolean, streak: number): number {
  if (!correct) return clamp(diff - 0.15);
  // Two correct in a row → step up; longer streaks step slightly faster.
  if (streak >= 2) return clamp(diff + (streak >= 4 ? 0.12 : 0.08));
  return diff;
}

function clamp(d: number): number {
  return Math.min(1, Math.max(0, d));
}
