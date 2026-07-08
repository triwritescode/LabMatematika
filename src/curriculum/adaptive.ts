// Edge-of-ability difficulty dial (specs §3): magnitude adapts *inside* a
// level. Correct streaks push diff up; misses pull it down.

export function initialDiff(mastery: number): number {
  // Start near the child's demonstrated level. Floor is deliberately off the
  // bottom so a fresh level isn't stuck on trivial 1+2 / 1+3 pairs all session.
  return clamp(0.3 + (mastery / 100) * 0.6);
}

export function nextDiff(diff: number, correct: boolean, streak: number): number {
  if (!correct) return clamp(diff - 0.12);
  // Step up as soon as a run forms so magnitude actually grows within a
  // 10-question session; longer streaks accelerate.
  if (streak >= 1) return clamp(diff + (streak >= 3 ? 0.14 : 0.09));
  return diff;
}

function clamp(d: number): number {
  return Math.min(1, Math.max(0, d));
}
