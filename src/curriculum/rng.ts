// Small random helpers for on-device question generation.

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Interpolate an integer range by the difficulty dial (0..1). */
export function scale(diff: number, min: number, max: number): number {
  const d = Math.min(1, Math.max(0, diff));
  return Math.round(min + (max - min) * d);
}

/** Random integer whose ceiling grows with diff: [min .. scale(diff)]. */
export function randUpTo(diff: number, min: number, max: number): number {
  const hi = Math.max(min, scale(diff, min, max));
  return randInt(min, hi);
}
