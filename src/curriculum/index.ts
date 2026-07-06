import { addLevels } from './labs/add';
import { divLevels } from './labs/divide';
import { mulLevels } from './labs/multiply';
import { subLevels } from './labs/subtract';
import { computeAnswer, Level, Operation, Question } from './types';

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

export function makeQuestion(level: Level, diff: number): Question {
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
