// Level-Up Exam assembly + pass/fail rules (§3.3, §12). Test conditions; strict bar.
import type { AnsweredQuestion, Level, Operation, Question, SubSkillId } from "@/types";
import {
  EXAM_MAX_CORE_MISSES,
  EXAM_MIN_CORRECT,
  QUESTIONS_PER_SESSION,
} from "@/lib/constants";
import { coreSubSkill, levelSubSkills } from "@/lib/subskills";
import { generateMixed, type GenerateOptions } from "@/lib/generator";

/** 10 questions covering ALL the level's sub-skills, weighted toward the core. */
export function assembleExam(
  operation: Operation,
  level: Level,
  opts: GenerateOptions = {},
): Question[] {
  const subs = levelSubSkills(operation, level);
  // Cover EVERY sub-skill at least once; the leftover goes to the core (index 0).
  // So per-number Level-1 facts (9 sub-skills) each get tested in the 10-question exam.
  const base = Math.floor(QUESTIONS_PER_SESSION / subs.length);
  const remainder = QUESTIONS_PER_SESSION - base * subs.length;
  const weights = subs.map((_, i) => base + (i === 0 ? remainder : 0));
  return generateMixed(operation, level, subs, QUESTIONS_PER_SESSION, opts, weights);
}

export interface ExamVerdict {
  correct: number;
  total: number;
  passed: boolean;
  coreMisses: number;
  /** Set when failed: the sub-skill to route practice back to (§3.3). */
  failingSubSkill?: SubSkillId;
  mistakes: AnsweredQuestion[];
}

export function gradeExam(
  operation: Operation,
  level: Level,
  answers: AnsweredQuestion[],
): ExamVerdict {
  const core = coreSubSkill(operation, level);
  const correct = answers.filter((a) => a.correct).length;
  const mistakes = answers.filter((a) => !a.correct);
  const coreMisses = mistakes.filter((a) => a.question.subSkill === core).length;

  const passed = correct >= EXAM_MIN_CORRECT && coreMisses <= EXAM_MAX_CORE_MISSES;

  let failingSubSkill: SubSkillId | undefined;
  if (!passed && mistakes.length > 0) {
    // Most-missed sub-skill; tie breaks toward the core.
    const missBySkill = new Map<SubSkillId, number>();
    for (const m of mistakes) {
      missBySkill.set(m.question.subSkill, (missBySkill.get(m.question.subSkill) ?? 0) + 1);
    }
    let worst = -1;
    for (const id of levelSubSkills(operation, level)) {
      const n = missBySkill.get(id) ?? 0;
      if (n > worst) {
        worst = n;
        failingSubSkill = id;
      }
    }
  }

  return { correct, total: answers.length, passed, coreMisses, failingSubSkill, mistakes };
}
