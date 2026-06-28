import { describe, it, expect } from "vitest";
import { applyMasteryGain, levelReady, weakestSubSkill, levelMastery } from "@/lib/mastery";
import type { LevelState } from "@/types";

describe("applyMasteryGain", () => {
  it("rewards a correct answer, more at the edge", () => {
    expect(applyMasteryGain(50, true, "neutral")).toBe(58);
    expect(applyMasteryGain(50, true, "harder")).toBeGreaterThan(
      applyMasteryGain(50, true, "neutral"),
    );
  });
  it("penalizes a miss and clamps to [0,100]", () => {
    expect(applyMasteryGain(2, false, "neutral")).toBe(0);
    expect(applyMasteryGain(98, true, "harder")).toBe(100);
  });
});

function state(masteries: Record<string, number>): LevelState {
  const subSkills = Object.fromEntries(
    Object.entries(masteries).map(([id, mastery]) => [
      id,
      { subSkill: id, mastery, attempts: 1, lastPracticedAt: null },
    ]),
  );
  return { unlocked: true, examPassed: false, subSkills };
}

describe("levelReady", () => {
  it("is ready only when all sub-skills ≥ 70", () => {
    const ids = ["a", "b"];
    expect(levelReady(state({ a: 70, b: 90 }), ids)).toBe(true);
    expect(levelReady(state({ a: 69, b: 90 }), ids)).toBe(false);
  });
});

describe("weakestSubSkill", () => {
  it("returns the least-mastered", () => {
    expect(weakestSubSkill(state({ a: 80, b: 30, c: 50 }), ["a", "b", "c"])).toBe("b");
  });
});

describe("levelMastery", () => {
  it("averages sub-skill mastery", () => {
    expect(levelMastery(state({ a: 40, b: 60 }), ["a", "b"])).toBe(50);
  });
});
