import { questionsForLevel } from './bank';
import { getSkill, skillsForLevel } from './index';
import { BankQuestion, Difficulty, DIFF_FOR, Operation, Question } from './types';

// Ujian Kenaikan Level (specs §4.3): test conditions (no hints/explanations/
// re-queue), NO timer. Per the bank refactor the exam draws only the hardest
// authored questions: 15 Sulit questions spread across the level's skills.

export const EXAM_SIZE = 15;
export const EXAM_PASS_CORRECT = 13; // ≥ 13/15
export const EXAM_MAX_CORE_MISSES = 1; // ≤ 1 miss on core skills

// Prefer Sulit; fall back to Sedang then Mudah only if a lab lacks enough Sulit.
const TIER_ORDER: Difficulty[] = ['sulit', 'sedang', 'mudah'];

function toQuestion(q: BankQuestion): Question {
  return { ...q, diff: DIFF_FOR[q.difficulty] };
}

export function buildExam(lab: Operation, level: number): Question[] {
  const levelIds = skillsForLevel(lab, level).map((l) => l.id);
  const chosen: BankQuestion[] = [];
  const used = new Set<string>();
  for (const level of TIER_ORDER) {
    if (chosen.length >= EXAM_SIZE) break;
    const pool = levelIds
      .flatMap((id) => questionsForLevel(id, level))
      .filter((q) => !used.has(q.code));
    for (const q of shuffle(pool)) {
      if (chosen.length >= EXAM_SIZE) break;
      chosen.push(q);
      used.add(q.code);
    }
  }
  return shuffle(chosen).map(toQuestion);
}

export type ExamAnswer = { question: Question; correct: boolean };

export type ExamVerdict = {
  passed: boolean;
  correctCount: number;
  coreMisses: number;
  /** Weakest skill to route back to Latihan Terarah on failure. */
  failedLevelId?: string;
};

export function judgeExam(answers: ExamAnswer[]): ExamVerdict {
  const correctCount = answers.filter((a) => a.correct).length;
  const misses = answers.filter((a) => !a.correct);
  const coreMisses = misses.filter((a) => isCore(a.question.skillId)).length;
  const passed = correctCount >= EXAM_PASS_CORRECT && coreMisses <= EXAM_MAX_CORE_MISSES;

  let failedLevelId: string | undefined;
  if (!passed && misses.length > 0) {
    // Route to the skill missed most often (core misses win ties).
    const counts = new Map<string, number>();
    for (const m of misses) {
      counts.set(m.question.skillId, (counts.get(m.question.skillId) ?? 0) + 1);
    }
    failedLevelId = [...counts.entries()].sort(
      (x, y) => y[1] - x[1] || Number(isCore(y[0])) - Number(isCore(x[0]))
    )[0][0];
  }

  return { passed, correctCount, coreMisses, failedLevelId };
}

function isCore(skillId: string): boolean {
  return getSkill(skillId).isCore;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
