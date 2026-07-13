export type Operation = 'add' | 'sub' | 'mul' | 'div';
export type Tipe = 'fakta' | 'algoritma' | 'konsep';
export type Difficulty = 'mudah' | 'sedang' | 'sulit';

export type Skill = {
  id: string; // "add.pertambahan-0-9" — derived from CSV (lab + SKILL slug)
  lab: Operation;
  level: number; // 1..N (CSV LEVEL column)
  ordinal: number; // order within the level
  labelId: string; // Bahasa Indonesia display label (CSV SKILL)
  tipe: Tipe; // "fakta" → Tantangan Kilat eligible
  isCore: boolean; // strictly judged in exams
  prereqs: string[]; // skill ids required first
};

// One authored question from the CSV bank (src/curriculum/bank.data.ts).
export type BankQuestion = {
  code: string; // stable CSV id, e.g. "ADD0000000000001"
  skillId: string;
  lab: Operation;
  prompt: string; // display text, e.g. "0 ÷ 1"
  answer: number;
  difficulty: Difficulty;
  explanation: string; // pre-written worked explanation (Bahasa Indonesia)
};

// A served question: a bank question plus the difficulty dial used for mastery
// math (derived from `difficulty`, not adaptive — practice mixes tiers).
export type Question = BankQuestion & {
  diff: number;
};

export type SkillMastery = {
  skillId: string;
  mastery: number; // 0..100
  attempts: number;
  lastPracticedAt: string;
  dueForReview?: string;
};

export type LabProgress = {
  lab: Operation;
  rank: string;
  placementDone: boolean;
  levelsPassed: number[];
  skills: Record<string, SkillMastery>;
};

// Map a fixed difficulty level to the 0..1 dial used by mastery math. Practice
// serves a mix of tiers (no adaptive climb), so this is only used to weight the
// mastery gain of the served question.
export const DIFF_FOR: Record<Difficulty, number> = {
  mudah: 0.2,
  sedang: 0.5,
  sulit: 0.85,
};

export const OPERATION_SYMBOL: Record<Operation, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: '÷',
};

export function computeAnswer(op: Operation, a: number, b: number): number {
  switch (op) {
    case 'add':
      return a + b;
    case 'sub':
      return a - b;
    case 'mul':
      return a * b;
    case 'div':
      return a / b;
  }
}
