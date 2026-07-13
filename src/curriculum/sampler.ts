import { questionsForLevel } from './bank';
import { DIFF_FOR, Skill, Question } from './types';

// Session question sampler. Serves authored questions from the CSV bank
// (bank.ts) instead of generating them. Practice mixes all difficulty tiers
// (Mudah/Sedang/Sulit) — no adaptive climb — and never repeats a question within
// a session until the skill's pool is exhausted, then reshuffles.

export type Sampler = {
  /** Draw the next question for this skill. */
  next: () => Question;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSampler(skill: Skill): Sampler {
  const pool = questionsForLevel(skill.id);
  let queue = shuffle(pool);
  let i = 0;

  return {
    next(): Question {
      if (pool.length === 0) {
        // No questions for this skill (bank not yet covering it). Degrade
        // gracefully with a placeholder rather than crashing the screen.
        return {
          code: `${skill.id}:empty`,
          skillId: skill.id,
          lab: skill.lab,
          prompt: '—',
          answer: 0,
          difficulty: 'mudah',
          explanation: '',
          diff: DIFF_FOR.mudah,
        };
      }
      if (i >= queue.length) {
        queue = shuffle(pool);
        i = 0;
      }
      const q = queue[i++];
      return { ...q, diff: DIFF_FOR[q.difficulty] };
    },
  };
}
