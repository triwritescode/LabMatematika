import { describe, it, expect } from "vitest";
import { gradeExam } from "@/lib/exam";
import { analyzeDiagnostic } from "@/lib/diagnostic";
import { coreSubSkill } from "@/lib/subskills";
import type { AnsweredQuestion, Operation, Level, SubSkillId } from "@/types";

function ans(operation: Operation, level: Level, subSkill: SubSkillId, correct: boolean): AnsweredQuestion {
  return {
    question: { id: Math.random().toString(), a: 1, b: 1, operation, level, subSkill, answer: 2 },
    given: correct ? 2 : 0,
    correct,
  };
}

describe("gradeExam", () => {
  const core = coreSubSkill("add", 2); // add.carry-single
  const other = "add.no-carry";

  it("passes at ≥9/10 with ≤1 core miss", () => {
    const answers = [
      ...Array(5).fill(ans("add", 2, core, true)),
      ...Array(4).fill(ans("add", 2, other, true)),
      ans("add", 2, other, false),
    ];
    const v = gradeExam("add", 2, answers);
    expect(v.correct).toBe(9);
    expect(v.passed).toBe(true);
  });

  it("fails when the core sub-skill is missed twice", () => {
    const answers = [
      ...Array(3).fill(ans("add", 2, core, true)),
      ...Array(2).fill(ans("add", 2, core, false)),
      ...Array(5).fill(ans("add", 2, other, true)),
    ];
    const v = gradeExam("add", 2, answers);
    expect(v.passed).toBe(false);
    expect(v.failingSubSkill).toBe(core);
  });
});

describe("analyzeDiagnostic", () => {
  it("locates the weakest sub-skill", () => {
    const core = coreSubSkill("add", 2);
    const answers = [
      ans("add", 2, "add.no-carry", true),
      ans("add", 2, "add.no-carry", true),
      ans("add", 2, core, false),
      ans("add", 2, core, false),
    ];
    expect(analyzeDiagnostic("add", 2, answers)).toBe(core);
  });
});
