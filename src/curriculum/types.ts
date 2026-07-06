export type Operation = 'add' | 'sub' | 'mul' | 'div';
export type Tipe = 'fakta' | 'algoritma' | 'konsep';

export type Level = {
  id: string; // "add.2d.carry"
  lab: Operation;
  tingkat: number; // 1..3
  urutan: number; // order within the tingkat
  labelId: string; // Bahasa Indonesia display label
  tipe: Tipe; // "fakta" → Tantangan Kilat eligible
  isCore: boolean; // strictly judged in exams
  prereqs: string[]; // level ids required first
  generate: (diff: number) => [number, number]; // diff 0..1 = magnitude dial
  explainId: string; // key into explain.ts
};

export type Question = {
  levelId: string;
  lab: Operation;
  a: number;
  b: number;
  answer: number;
  diff: number;
};

export type LevelMastery = {
  levelId: string;
  mastery: number; // 0..100
  attempts: number;
  lastPracticedAt: string;
  dueForReview?: string;
};

export type LabProgress = {
  lab: Operation;
  rank: string;
  placementDone: boolean;
  tingkatPassed: number[];
  levels: Record<string, LevelMastery>;
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
