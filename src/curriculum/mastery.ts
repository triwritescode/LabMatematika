import { levelsForTingkat, tingkatsForLab } from './index';
import { LabProgress, Level, Operation } from './types';

// Mastery meter math + unlock/readiness rules (specs §5).

export const UNLOCK_THRESHOLD = 70; // prereqs ≥ 70% unlock the next level
export const MASTERED_THRESHOLD = 80;

export type MasteryBand = 'belum' | 'sedang' | 'dikuasai';

export function masteryBand(mastery: number): MasteryBand {
  if (mastery > 79) return 'dikuasai';
  if (mastery > 40) return 'sedang';
  return 'belum';
}

/**
 * Meter delta for one answer.
 * Correct: base gain, slightly more on clean streaks and at higher difficulty.
 * Miss: small decay — the item also re-queues in-session.
 */
export function masteryDelta(correct: boolean, diff: number, streak: number): number {
  if (!correct) return -6;
  const streakBonus = Math.min(3, Math.max(0, streak - 2));
  const diffBonus = Math.round(diff * 2);
  return 4 + streakBonus + diffBonus;
}

export function clampMastery(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function masteryOf(progress: LabProgress, levelId: string): number {
  return progress.levels[levelId]?.mastery ?? 0;
}

export function isLevelUnlocked(progress: LabProgress, level: Level): boolean {
  // A level also requires its tingkat to be reachable (previous tingkat passed).
  const tingkats = tingkatsForLab(level.lab);
  const idx = tingkats.indexOf(level.tingkat);
  if (idx > 0 && !progress.tingkatPassed.includes(tingkats[idx - 1])) return false;
  return level.prereqs.every((id) => masteryOf(progress, id) >= UNLOCK_THRESHOLD);
}

/** All levels of the tingkat ≥ 70% → exam unlocked. */
export function isExamReady(progress: LabProgress, lab: Operation, tingkat: number): boolean {
  return levelsForTingkat(lab, tingkat).every(
    (l) => masteryOf(progress, l.id) >= UNLOCK_THRESHOLD
  );
}

export function labMasteryPercent(progress: LabProgress, levels: Level[]): number {
  if (levels.length === 0) return 0;
  const total = levels.reduce((sum, l) => sum + masteryOf(progress, l.id), 0);
  return Math.round(total / levels.length);
}

/** Current tingkat the child is working on (first unpassed). */
export function currentTingkat(progress: LabProgress, lab: Operation): number {
  const tingkats = tingkatsForLab(lab);
  for (const t of tingkats) {
    if (!progress.tingkatPassed.includes(t)) return t;
  }
  return tingkats[tingkats.length - 1];
}

const RANKS: Record<Operation, string[]> = {
  add: [
    'Penjumlah Pemula',
    'Penjumlah Andal',
    'Penjumlah Mahir',
    'Penjumlah Ahli',
    'Penjumlah Master',
  ],
  sub: ['Pengurang Pemula', 'Pengurang Andal', 'Pengurang Ahli'],
  mul: ['Pengali Pemula', 'Ahli Tabel', 'Pengali Ahli'],
  div: ['Pembagi Pemula', 'Pembagi Andal', 'Pembagi Ahli'],
};

export function rankFor(lab: Operation, tingkatPassed: number[]): string {
  const idx = Math.min(tingkatPassed.length, RANKS[lab].length - 1);
  return RANKS[lab][idx];
}
