import { describe, it, expect } from "vitest";
import { hasCarrying, hasBorrowing, detectSubSkill } from "@/lib/subskills";

describe("hasCarrying", () => {
  it("detects a carry in the units column", () => {
    expect(hasCarrying(65, 6)).toBe(true); // 5+6=11
  });
  it("returns false when no column carries", () => {
    expect(hasCarrying(12, 7)).toBe(false); // 2+7=9
  });
});

describe("hasBorrowing", () => {
  it("detects a borrow", () => {
    expect(hasBorrowing(45, 8)).toBe(true); // 5<8
  });
  it("returns false when no borrow needed", () => {
    expect(hasBorrowing(48, 5)).toBe(false); // 8>=5
  });
});

describe("detectSubSkill", () => {
  it("tags carrying only for addition", () => {
    expect(detectSubSkill("add", 65, 6)).toBe("carrying");
    expect(detectSubSkill("multiply", 65, 6)).toBeUndefined();
  });
  it("tags borrowing only for subtraction", () => {
    expect(detectSubSkill("subtract", 45, 8)).toBe("borrowing");
  });
});
