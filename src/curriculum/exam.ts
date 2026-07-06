import { getLevel, levelsForTingkat, makeQuestion } from './index';
import { Level, Operation, Question } from './types';

// Ujian Kenaikan Tingkat (specs §4.3): 10 questions covering all levels of the
// tingkat, test conditions (no hints/explanations/re-queue), NO timer.

export const EXAM_SIZE = 10;
export const EXAM_PASS_CORRECT = 9; // ≥ 9/10
export const EXAM_MAX_CORE_MISSES = 1; // ≤ 1 miss on core levels

export function buildExam(lab: Operation, tingkat: number): Question[] {
  const levels = levelsForTingkat(lab, tingkat);
  const questions: Question[] = [];
  // Cover every level at least once, core levels twice where room allows.
  const pool: Level[] = [...levels, ...levels.filter((l) => l.isCore)];
  while (pool.length < EXAM_SIZE) pool.push(levels[pool.length % levels.length]);
  shuffle(pool);
  for (const level of pool.slice(0, EXAM_SIZE)) {
    questions.push(makeQuestion(level, 0.6 + Math.random() * 0.3));
  }
  return questions;
}

export type ExamAnswer = { question: Question; correct: boolean };

export type ExamVerdict = {
  passed: boolean;
  correctCount: number;
  coreMisses: number;
  /** Weakest level to route back to Latihan Terarah on failure. */
  failedLevelId?: string;
};

export function judgeExam(answers: ExamAnswer[]): ExamVerdict {
  const correctCount = answers.filter((a) => a.correct).length;
  const misses = answers.filter((a) => !a.correct);
  const coreMisses = misses.filter((a) => isCore(a.question.levelId)).length;
  const passed = correctCount >= EXAM_PASS_CORRECT && coreMisses <= EXAM_MAX_CORE_MISSES;

  let failedLevelId: string | undefined;
  if (!passed && misses.length > 0) {
    // Route to the level missed most often (core misses win ties).
    const counts = new Map<string, number>();
    for (const m of misses) {
      counts.set(m.question.levelId, (counts.get(m.question.levelId) ?? 0) + 1);
    }
    failedLevelId = [...counts.entries()].sort(
      (x, y) => y[1] - x[1] || Number(isCore(y[0])) - Number(isCore(x[0]))
    )[0][0];
  }

  return { passed, correctCount, coreMisses, failedLevelId };
}

function isCore(levelId: string): boolean {
  return getLevel(levelId).isCore;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
