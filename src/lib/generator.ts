// Question generation per operation/level with adaptive bias (§3, §5, §11).
// Pure + deterministic given an injectable RNG (testable, no global Math.random in tests).
import type {
  DifficultyBias,
  Level,
  Operation,
  Performance,
  Question,
} from "@/types";
import { adaptDifficulty } from "@/lib/adaptive";
import { detectSubSkill } from "@/lib/subskills";

export type Rng = () => number; // [0, 1)

const defaultRng: Rng = Math.random;

/** Inclusive integer in [min, max]. */
function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick a value within [min,max], skewed by bias toward one end of the range. */
function biasedInt(rng: Rng, min: number, max: number, bias: DifficultyBias): number {
  if (bias === "neutral" || min >= max) return randInt(rng, min, max);
  const mid = Math.floor((min + max) / 2);
  return bias === "harder" ? randInt(rng, mid, max) : randInt(rng, min, mid);
}

/** Digit-count → inclusive numeric range, e.g. 2 → [10, 99]. */
function digitRange(digits: number): [number, number] {
  return [digits === 1 ? 1 : 10 ** (digits - 1), 10 ** digits - 1];
}

export function compute(operation: Operation, a: number, b: number): number {
  switch (operation) {
    case "add":
      return a + b;
    case "subtract":
      return a - b;
    case "multiply":
      return a * b;
    case "divide":
      return a / b;
  }
}

function genAdd(rng: Rng, level: Level, bias: DifficultyBias): [number, number] {
  if (level === 1) {
    // two 1-digit, result <= 18 (any single-digit pair satisfies this)
    return [biasedInt(rng, 1, 9, bias), randInt(rng, 1, 9)];
  }
  const digits = Math.min(level, 4);
  const [lo, hi] = digitRange(digits);
  return [biasedInt(rng, lo, hi, bias), randInt(rng, 1, hi)];
}

function genSubtract(rng: Rng, level: Level, bias: DifficultyBias): [number, number] {
  const digits = level === 1 ? 1 : Math.min(level, 4);
  const [lo, hi] = digitRange(digits);
  const a = biasedInt(rng, lo, hi, bias);
  const b = randInt(rng, 1, a); // first >= second, no negatives (§3)
  return [a, b];
}

function genMultiply(rng: Rng, level: Level, bias: DifficultyBias): [number, number] {
  // L1: 1×1, L2: 2×1, L3: 2×2, L4: 3×2, L5: mixed/large
  const shape: Record<Level, [number, number]> = {
    1: [1, 1],
    2: [2, 1],
    3: [2, 2],
    4: [3, 2],
    5: [3, 3],
  };
  const [da, db] = shape[level];
  const [aLo, aHi] = digitRange(da);
  const [bLo, bHi] = digitRange(db);
  return [biasedInt(rng, aLo, aHi, bias), randInt(rng, bLo, bHi)];
}

function genDivide(rng: Rng, level: Level, bias: DifficultyBias): [number, number] {
  // Build from quotient × divisor so the result is always whole (§3).
  const shape: Record<Level, { q: [number, number]; d: [number, number] }> = {
    1: { q: [1, 9], d: [1, 9] },
    2: { q: [10, 99], d: [2, 9] },
    3: { q: [10, 99], d: [10, 99] },
    4: { q: [100, 999], d: [10, 99] },
    5: { q: [100, 999], d: [10, 99] },
  };
  const { q, d } = shape[level];
  const quotient = biasedInt(rng, q[0], q[1], bias);
  const divisor = randInt(rng, d[0], d[1]);
  return [quotient * divisor, divisor];
}

function generateOperands(
  rng: Rng,
  operation: Operation,
  level: Level,
  bias: DifficultyBias,
): [number, number] {
  switch (operation) {
    case "add":
      return genAdd(rng, level, bias);
    case "subtract":
      return genSubtract(rng, level, bias);
    case "multiply":
      return genMultiply(rng, level, bias);
    case "divide":
      return genDivide(rng, level, bias);
  }
}

export interface GenerateOptions {
  rng?: Rng;
  performance?: Performance;
}

export function generateQuestion(
  operation: Operation,
  level: Level,
  opts: GenerateOptions = {},
): Question {
  const rng = opts.rng ?? defaultRng;
  const bias = opts.performance ? adaptDifficulty(opts.performance) : "neutral";
  const [a, b] = generateOperands(rng, operation, level, bias);
  return {
    id: `${operation}-${level}-${a}-${b}-${Math.floor(rng() * 1e6)}`,
    a,
    b,
    operation,
    level,
    answer: compute(operation, a, b),
    subSkill: detectSubSkill(operation, a, b),
  };
}

/** A session's worth of questions, de-duplicated by (a,b) pair (§11). */
export function generateSession(
  operation: Operation,
  level: Level,
  count: number,
  opts: GenerateOptions = {},
): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const q = generateQuestion(operation, level, opts);
    const key = `${q.a}×${q.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
