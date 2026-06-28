// Diagnostic assessment (§3.1): a short mixed set whose only job is to LOCATE the
// kid's weakest sub-skill and set the practice target.
import type { AnsweredQuestion, Level, Operation, Question, SubSkillId } from "@/types";
import { DIAGNOSTIC_SIZE } from "@/lib/constants";
import { levelSubSkills } from "@/lib/subskills";
import { generateMixed, type GenerateOptions } from "@/lib/generator";

export function assembleDiagnostic(
  operation: Operation,
  level: Level,
  opts: GenerateOptions = {},
): Question[] {
  const subs = levelSubSkills(operation, level);
  // Cover every sub-skill at least once (Level 1 has 9 per-number facts).
  const size = Math.max(DIAGNOSTIC_SIZE, subs.length);
  return generateMixed(operation, level, subs, size, opts);
}

/**
 * Find the weakest sub-skill from diagnostic answers: lowest accuracy.
 * Ties break toward the level's core (earliest in the level's sub-skill list).
 */
export function analyzeDiagnostic(
  operation: Operation,
  level: Level,
  answers: AnsweredQuestion[],
): SubSkillId {
  const order = levelSubSkills(operation, level);
  const stats = new Map<SubSkillId, { correct: number; total: number }>();
  for (const id of order) stats.set(id, { correct: 0, total: 0 });

  for (const a of answers) {
    const s = stats.get(a.question.subSkill);
    if (!s) continue;
    s.total++;
    if (a.correct) s.correct++;
  }

  let target = order[0];
  let worst = Infinity;
  for (const id of order) {
    const s = stats.get(id)!;
    // Unseen sub-skills count as fully unknown (accuracy 0) so they get attention.
    const acc = s.total > 0 ? s.correct / s.total : 0;
    if (acc < worst) {
      worst = acc;
      target = id;
    }
  }
  return target;
}
