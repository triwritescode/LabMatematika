// Sub-skill-constrained question generation (§11). Generation is forced to PRODUCE
// the target sub-skill (e.g. exactly one carry), not just a random level problem.
// Pure + RNG-injectable for deterministic tests.
import type { DifficultyBias, Level, Operation, Performance, Question, SubSkillId } from "@/types";
import { adaptToEdge } from "@/lib/adaptive";
import { countCarries, countBorrows, hasBorrowAcrossZero, factNumber } from "@/lib/subskills";

export type Rng = () => number; // [0, 1)
const defaultRng: Rng = Math.random;

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Skew a pick toward the harder/easier end of a range (edge of ability, §5). */
function biasedInt(rng: Rng, min: number, max: number, bias: DifficultyBias): number {
  if (bias === "neutral" || min >= max) return randInt(rng, min, max);
  const mid = Math.floor((min + max) / 2);
  return bias === "harder" ? randInt(rng, mid, max) : randInt(rng, min, mid);
}

/** Digit count for a multi-digit problem at a level (L5 = mixed 2–4). */
function digitsForLevel(rng: Rng, level: Level): number {
  if (level >= 5) return randInt(rng, 2, 4);
  return Math.max(2, level);
}

function digitRange(digits: number): [number, number] {
  return [10 ** (digits - 1), 10 ** digits - 1];
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

/** Rejection-sample an [a,b] pair until `ok` holds; falls back to last candidate. */
function sample(
  rng: Rng,
  gen: () => [number, number],
  ok: (a: number, b: number) => boolean,
  tries = 200,
): [number, number] {
  let last: [number, number] = gen();
  for (let i = 0; i < tries; i++) {
    last = gen();
    if (ok(last[0], last[1])) return last;
  }
  return last;
}

/** Pair the target number with a random 1–9 partner, in random order. */
function factPair(rng: Rng, n: number): [number, number] {
  const partner = randInt(rng, 1, 9);
  return rng() < 0.5 ? [n, partner] : [partner, n];
}

function genAdd(rng: Rng, level: Level, sub: SubSkillId, bias: DifficultyBias): [number, number] {
  const n = factNumber(sub);
  if (n !== null) return factPair(rng, n); // add.fact-N: N meets each 1–9
  if (sub === "add.facts") {
    return [biasedInt(rng, 1, 9, bias), randInt(rng, 1, 9)];
  }
  const d = digitsForLevel(rng, level);
  const [lo, hi] = digitRange(d);
  const gen = (): [number, number] => [biasedInt(rng, lo, hi, bias), randInt(rng, 1, hi)];
  if (sub === "add.no-carry") return sample(rng, gen, (a, b) => countCarries(a, b) === 0);
  if (sub === "add.carry-single") return sample(rng, gen, (a, b) => countCarries(a, b) === 1);
  return sample(rng, gen, (a, b) => countCarries(a, b) >= 2); // add.carry-multi
}

function genSubtract(rng: Rng, level: Level, sub: SubSkillId, bias: DifficultyBias): [number, number] {
  if (sub === "sub.facts") {
    const a = biasedInt(rng, 1, 9, bias);
    return [a, randInt(rng, 0, a)];
  }
  if (sub === "sub.borrow-zero") {
    // Construct a round minuend (zeros below the top digit) → borrow across zero.
    const d = Math.max(3, digitsForLevel(rng, level));
    const top = randInt(rng, 1, 9);
    const a = top * 10 ** (d - 1); // e.g. 200, 3000
    const b = randInt(rng, 11, 10 ** (d - 1) - 1); // smaller, multi-digit
    return [a, b];
  }
  const d = digitsForLevel(rng, level);
  const [lo, hi] = digitRange(d);
  const gen = (): [number, number] => {
    const a = biasedInt(rng, lo, hi, bias);
    return [a, randInt(rng, 1, a)];
  };
  if (sub === "sub.no-borrow") return sample(rng, gen, (a, b) => countBorrows(a, b) === 0);
  return sample(rng, gen, (a, b) => countBorrows(a, b) === 1 && !hasBorrowAcrossZero(a, b)); // borrow-single
}

function genMultiply(rng: Rng, level: Level, sub: SubSkillId, bias: DifficultyBias): [number, number] {
  const n = factNumber(sub);
  if (n !== null) return factPair(rng, n); // mul.table-N: N × each 1–9
  switch (sub) {
    case "mul.facts":
      return [biasedInt(rng, 2, 9, bias), randInt(rng, 2, 9)];
    case "mul.2x1":
      return [biasedInt(rng, 10, 99, bias), randInt(rng, 2, 9)];
    case "mul.2x2":
      return [biasedInt(rng, 10, 99, bias), randInt(rng, 11, 99)];
    default: // mul.multi
      return [biasedInt(rng, 100, 999, bias), randInt(rng, 11, 99)];
  }
}

function genDivide(rng: Rng, level: Level, sub: SubSkillId, bias: DifficultyBias): [number, number] {
  // Build from quotient × divisor so the result is always whole (§4).
  let q: [number, number];
  let dv: [number, number];
  switch (sub) {
    case "div.facts":
      q = [1, 9];
      dv = [2, 9];
      break;
    case "div.2x1":
      q = [10, 99];
      dv = [2, 9];
      break;
    case "div.long":
      q = [10, 99];
      dv = [11, 99];
      break;
    default: // div.large
      q = [100, 999];
      dv = [11, 99];
  }
  const quotient = biasedInt(rng, q[0], q[1], bias);
  const divisor = randInt(rng, dv[0], dv[1]);
  return [quotient * divisor, divisor];
}

export function generateForSubSkill(
  rng: Rng,
  operation: Operation,
  level: Level,
  subSkill: SubSkillId,
  bias: DifficultyBias,
): [number, number] {
  switch (operation) {
    case "add":
      return genAdd(rng, level, subSkill, bias);
    case "subtract":
      return genSubtract(rng, level, subSkill, bias);
    case "multiply":
      return genMultiply(rng, level, subSkill, bias);
    case "divide":
      return genDivide(rng, level, subSkill, bias);
  }
}

export interface GenerateOptions {
  rng?: Rng;
  performance?: Performance;
}

export function generateQuestion(
  operation: Operation,
  level: Level,
  subSkill: SubSkillId,
  opts: GenerateOptions = {},
): Question {
  const rng = opts.rng ?? defaultRng;
  const bias = opts.performance ? adaptToEdge(opts.performance) : "neutral";
  const [a, b] = generateForSubSkill(rng, operation, level, subSkill, bias);
  return {
    id: `${subSkill}-${a}-${b}-${Math.floor(rng() * 1e6)}`,
    a,
    b,
    operation,
    level,
    subSkill,
    answer: compute(operation, a, b),
  };
}

/** N questions drilling ONE sub-skill, de-duplicated (§3.2, §11). */
export function generateSession(
  operation: Operation,
  level: Level,
  subSkill: SubSkillId,
  count: number,
  opts: GenerateOptions = {},
): Question[] {
  const out: Question[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    const q = generateQuestion(operation, level, subSkill, opts);
    const key = `${q.a}×${q.b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A mixed set across several sub-skills (Diagnostic §3.1, Exam §3.3).
 * `weights[i]` is how many questions to draw for `subSkills[i]`; remaining slots
 * are filled round-robin. Shuffled so sub-skills interleave.
 */
export function generateMixed(
  operation: Operation,
  level: Level,
  subSkills: SubSkillId[],
  count: number,
  opts: GenerateOptions = {},
  weights?: number[],
): Question[] {
  const rng = opts.rng ?? defaultRng;
  const plan: SubSkillId[] = [];
  if (weights) {
    subSkills.forEach((s, i) => {
      for (let k = 0; k < (weights[i] ?? 0); k++) plan.push(s);
    });
  }
  let i = 0;
  while (plan.length < count) {
    plan.push(subSkills[i % subSkills.length]);
    i++;
  }
  plan.length = count;

  const seen = new Set<string>();
  const out: Question[] = [];
  for (const sub of plan) {
    let guard = 0;
    while (guard++ < 30) {
      const q = generateQuestion(operation, level, sub, opts);
      const key = `${q.a}×${q.b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      break;
    }
  }
  return shuffle(out, rng);
}
