import { describe, it, expect } from "vitest";
import { scoreSession } from "@/lib/scorer";
import { adaptDifficulty } from "@/lib/adaptive";
import type { AnsweredQuestion, Question } from "@/types";

function answered(correct: boolean): AnsweredQuestion {
  const q: Question = {
    id: "x",
    a: 1,
    b: 1,
    operation: "add",
    level: 1,
    answer: 2,
  };
  return { question: q, given: correct ? 2 : 0, correct };
}

describe("scoreSession", () => {
  it("computes score, stars, coins", () => {
    const answers = [
      ...Array(8).fill(answered(true)),
      ...Array(2).fill(answered(false)),
    ];
    const s = scoreSession(answers, "tantangan");
    expect(s.score).toBe(8);
    expect(s.stars).toBe(2);
    expect(s.coinsEarned).toBe(80);
    expect(s.unlockedNextLevel).toBe(true); // 8 >= 7 in Challenge
    expect(s.mistakes).toHaveLength(2);
  });

  it("does not unlock in Latihan mode even with a high score", () => {
    const s = scoreSession(Array(10).fill(answered(true)), "latihan");
    expect(s.unlockedNextLevel).toBe(false);
  });
});

describe("adaptDifficulty", () => {
  it("biases harder after 3 correct in a row", () => {
    expect(adaptDifficulty({ recent: [true, true, true], subSkillMisses: {} })).toBe(
      "harder",
    );
  });
  it("biases easier after 2 wrong in a row", () => {
    expect(adaptDifficulty({ recent: [false, false], subSkillMisses: {} })).toBe(
      "easier",
    );
  });
  it("stays neutral otherwise", () => {
    expect(adaptDifficulty({ recent: [true, false], subSkillMisses: {} })).toBe(
      "neutral",
    );
  });
});
