import { describe, it, expect } from "vitest";
import {
  countCarries,
  countBorrows,
  hasBorrowAcrossZero,
  coreSubSkill,
  levelSubSkills,
  factNumber,
  addFactId,
  mulTableId,
} from "@/lib/subskills";

describe("countCarries", () => {
  it("counts carry columns", () => {
    expect(countCarries(65, 6)).toBe(1); // 5+6=11
    expect(countCarries(12, 7)).toBe(0); // 2+7=9
    expect(countCarries(99, 99)).toBe(2); // 9+9=18 carry, 9+9+1=19 carry
  });
});

describe("countBorrows", () => {
  it("counts borrow columns", () => {
    expect(countBorrows(45, 8)).toBe(1); // 5<8
    expect(countBorrows(48, 5)).toBe(0); // 8>=5
  });
});

describe("hasBorrowAcrossZero", () => {
  it("detects borrowing through a zero", () => {
    expect(hasBorrowAcrossZero(200, 45)).toBe(true);
    expect(hasBorrowAcrossZero(48, 5)).toBe(false);
  });
});

describe("level sub-skill mapping", () => {
  it("exposes a core sub-skill per level", () => {
    expect(coreSubSkill("add", 2)).toBe("add.carry-single");
  });

  it("Level 1 add + multiply split into per-number fact families (1–9)", () => {
    expect(levelSubSkills("add", 1)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(addFactId),
    );
    expect(levelSubSkills("multiply", 1)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map(mulTableId),
    );
  });

  it("factNumber parses per-number fact ids", () => {
    expect(factNumber("add.fact-7")).toBe(7);
    expect(factNumber("mul.table-3")).toBe(3);
    expect(factNumber("add.carry-single")).toBeNull();
  });
});
