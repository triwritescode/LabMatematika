// Spaced-repetition scheduling (§3.2, §7). A miss resurfaces soon; a confident
// correct pushes the next review further out (Leitner-style intervals).
import type { LevelState, SubSkillId } from "@/types";

const DAY_MS = 86_400_000;

function addDays(fromISO: string, days: number): string {
  return new Date(new Date(fromISO).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Next due date (yyyy-mm-dd) for a sub-skill after an answer. */
export function nextReviewDate(nowISO: string, correct: boolean, mastery: number): string {
  if (!correct) return addDays(nowISO, 1);
  const interval = mastery >= 81 ? 7 : mastery >= 41 ? 3 : 1;
  return addDays(nowISO, interval);
}

/** Sub-skills whose spaced-review date is due on or before `todayISO`. */
export function dueSubSkills(state: LevelState, todayISO: string): SubSkillId[] {
  return Object.values(state.subSkills)
    .filter((s) => s.dueForReview && s.dueForReview <= todayISO)
    .map((s) => s.subSkill);
}
