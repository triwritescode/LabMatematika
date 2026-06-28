// Mastery meter math + level-up readiness (§5). Drives the whole app.
import type { DifficultyBias, LevelState, SubSkillId } from "@/types";
import { EXAM_READY_THRESHOLD } from "@/lib/constants";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * New mastery after one answer.
 *  - correct at the edge of ability (harder bias) → more gain
 *  - a miss → small decrease (resurfaces in practice + spaced review §5)
 *  - a small correct streak adds a little extra.
 */
export function applyMasteryGain(
  current: number,
  correct: boolean,
  bias: DifficultyBias,
  streak = 0,
): number {
  if (!correct) return clamp(current - 5);
  const base = bias === "harder" ? 12 : bias === "easier" ? 5 : 8;
  const streakBonus = Math.min(streak, 3); // cleaner streaks → slightly more
  return clamp(current + base + streakBonus);
}

/** A level's exam unlocks when ALL its sub-skills reach the ready threshold (§5). */
export function levelReady(state: LevelState, subSkills: SubSkillId[]): boolean {
  return subSkills.every((id) => (state.subSkills[id]?.mastery ?? 0) >= EXAM_READY_THRESHOLD);
}

/** The least-mastered sub-skill — the deliberate-practice target (§6). */
export function weakestSubSkill(state: LevelState, subSkills: SubSkillId[]): SubSkillId {
  let weakest = subSkills[0];
  let min = Infinity;
  for (const id of subSkills) {
    const m = state.subSkills[id]?.mastery ?? 0;
    if (m < min) {
      min = m;
      weakest = id;
    }
  }
  return weakest;
}

/** Average mastery across a level's sub-skills (for the level path display). */
export function levelMastery(state: LevelState, subSkills: SubSkillId[]): number {
  if (subSkills.length === 0) return 0;
  const sum = subSkills.reduce((acc, id) => acc + (state.subSkills[id]?.mastery ?? 0), 0);
  return Math.round(sum / subSkills.length);
}
