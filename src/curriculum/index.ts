import { addLevels } from './labs/add';
import { divLevels } from './labs/divide';
import { mulLevels } from './labs/multiply';
import { subLevels } from './labs/subtract';
import { canonicalKey } from './sampler';
import { computeAnswer, Level, Operation, Question } from './types';

export { canonicalKey, createSampler } from './sampler';
export type { Sampler } from './sampler';

export const ALL_LEVELS: Level[] = [...addLevels, ...subLevels, ...mulLevels, ...divLevels];

const byId = new Map(ALL_LEVELS.map((l) => [l.id, l]));

export function getLevel(id: string): Level {
  const level = byId.get(id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export function levelsForLab(lab: Operation): Level[] {
  return ALL_LEVELS.filter((l) => l.lab === lab).sort(
    (a, b) => a.tingkat - b.tingkat || a.urutan - b.urutan
  );
}

export function levelsForTingkat(lab: Operation, tingkat: number): Level[] {
  return levelsForLab(lab).filter((l) => l.tingkat === tingkat);
}

export function tingkatsForLab(lab: Operation): number[] {
  return [...new Set(levelsForLab(lab).map((l) => l.tingkat))].sort((a, b) => a - b);
}

/** Canonical fingerprint of a served question (commutative labs fold a·b/b·a). */
export function questionKey(q: Pick<Question, 'lab' | 'a' | 'b'>): string {
  return canonicalKey(q.lab, q.a, q.b);
}

function build(level: Level, diff: number): Question {
  const [a, b] = level.generate(diff);
  return {
    levelId: level.id,
    lab: level.lab,
    a,
    b,
    answer: computeAnswer(level.lab, a, b),
    diff,
  };
}

/**
 * Generate a question for the level. When a `seen` set is passed, avoid
 * repeating any question already served this session: retry on a collision and,
 * as attempts grow, widen the magnitude dial to escape a small value domain
 * (e.g. facts within 5). The chosen question is recorded in `seen`.
 * If the domain is genuinely exhausted the last candidate is used anyway.
 */
export function makeQuestion(level: Level, diff: number, seen?: Set<string>): Question {
  let q = build(level, diff);
  if (seen) {
    const MAX_ATTEMPTS = 200;
    for (let i = 0; i < MAX_ATTEMPTS && seen.has(questionKey(q)); i++) {
      // Ramp to full magnitude within a few tries so retries sample the whole
      // value domain, then keep trying at max range.
      const widened = Math.min(1, diff + i * 0.12);
      q = build(level, widened);
    }
    seen.add(questionKey(q));
  }
  return q;
}
