import { skillsForLevel, levelsForLab } from './index';
import { LabProgress, Skill, Operation } from './types';

// Mastery meter math + unlock/readiness rules (specs §5).

export const UNLOCK_THRESHOLD = 70; // prereqs ≥ 70% unlock the next skill
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

// Diamonds earned from a practice session: 1 per correct answer while the child
// is still LEARNING the skill, but only a quarter (min 1) once the skill is
// already mastered at the start of the session. Keeps the reward tied to real
// progress and stops farming diamonds by re-grinding a finished skill.
export const REVIEW_DIAMOND_FACTOR = 0.25;

export function sessionDiamonds(correctCount: number, masteryStart: number): number {
  if (correctCount <= 0) return 0;
  if (masteryStart >= MASTERED_THRESHOLD) {
    return Math.max(1, Math.floor(correctCount * REVIEW_DIAMOND_FACTOR));
  }
  return correctCount;
}

function masteryOf(progress: LabProgress, skillId: string): number {
  return progress.skills?.[skillId]?.mastery ?? 0;
}

export function isSkillUnlocked(progress: LabProgress, skill: Skill): boolean {
  // A skill also requires its level to be reachable (previous level passed).
  const levels = levelsForLab(skill.lab);
  const idx = levels.indexOf(skill.level);
  if (idx > 0 && !progress.levelsPassed.includes(levels[idx - 1])) return false;
  return skill.prereqs.every((id) => masteryOf(progress, id) >= UNLOCK_THRESHOLD);
}

/** All skills of the level ≥ 70% → exam unlocked. */
export function isExamReady(progress: LabProgress, lab: Operation, level: number): boolean {
  return skillsForLevel(lab, level).every(
    (l) => masteryOf(progress, l.id) >= UNLOCK_THRESHOLD
  );
}

export function labMasteryPercent(progress: LabProgress, skills: Skill[]): number {
  if (skills.length === 0) return 0;
  const total = skills.reduce((sum, l) => sum + masteryOf(progress, l.id), 0);
  return Math.round(total / skills.length);
}

/** Current level the child is working on (first unpassed). */
export function currentLevel(progress: LabProgress, lab: Operation): number {
  const levels = levelsForLab(lab);
  for (const t of levels) {
    if (!progress.levelsPassed.includes(t)) return t;
  }
  return levels[levels.length - 1];
}

const RANKS: Record<Operation, string[]> = {
  add: [
    'Penjumlah Pemula',
    'Penjumlah Andal',
    'Penjumlah Mahir',
    'Penjumlah Ahli',
    'Penjumlah Master',
  ],
  sub: [
    'Pengurang Pemula',
    'Pengurang Andal',
    'Pengurang Mahir',
    'Pengurang Ahli',
    'Pengurang Master',
  ],
  mul: [
    'Pengali Pemula',
    'Ahli Tabel',
    'Pengali Mahir',
    'Pengali Ahli',
    'Pengali Master',
  ],
  div: [
    'Pembagi Pemula',
    'Pembagi Andal',
    'Pembagi Mahir',
    'Pembagi Ahli',
    'Pembagi Master',
  ],
};

export function rankFor(lab: Operation, levelsPassed: number[]): string {
  const idx = Math.min(levelsPassed.length, RANKS[lab].length - 1);
  return RANKS[lab][idx];
}
