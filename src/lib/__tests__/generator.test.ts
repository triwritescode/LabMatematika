import { describe, it, expect } from "vitest";
import { generateQuestion, generateSession, compute } from "@/lib/generator";
import { countCarries, countBorrows } from "@/lib/subskills";

describe("sub-skill-constrained generation", () => {
  it("add.no-carry produces zero carries", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("add", 2, "add.no-carry");
      expect(countCarries(q.a, q.b)).toBe(0);
      expect(q.answer).toBe(q.a + q.b);
    }
  });

  it("add.carry-single produces exactly one carry", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("add", 2, "add.carry-single");
      expect(countCarries(q.a, q.b)).toBe(1);
    }
  });

  it("add.carry-multi produces two or more carries", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("add", 3, "add.carry-multi");
      expect(countCarries(q.a, q.b)).toBeGreaterThanOrEqual(2);
    }
  });

  it("sub.borrow-single borrows exactly once and never goes negative", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("subtract", 2, "sub.borrow-single");
      expect(q.a).toBeGreaterThanOrEqual(q.b);
      expect(countBorrows(q.a, q.b)).toBe(1);
    }
  });

  it("division is always whole", () => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion("divide", 3, "div.long");
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.a % q.b).toBe(0);
    }
  });

  it("mul.2x1 is a 2-digit by 1-digit problem", () => {
    for (let i = 0; i < 50; i++) {
      const q = generateQuestion("multiply", 2, "mul.2x1");
      expect(q.a).toBeGreaterThanOrEqual(10);
      expect(q.a).toBeLessThanOrEqual(99);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
    }
  });
});

describe("Level 1 per-number fact families", () => {
  it("add.fact-N always includes N, partnered with 1–9", () => {
    for (let n = 1; n <= 9; n++) {
      const partners = new Set<number>();
      for (let i = 0; i < 80; i++) {
        const q = generateQuestion("add", 1, `add.fact-${n}`);
        expect(q.a === n || q.b === n).toBe(true);
        expect(q.answer).toBe(q.a + q.b);
        partners.add(q.a === n ? q.b : q.a);
      }
      // over many draws, N meets a spread of 1–9 partners
      expect(partners.size).toBeGreaterThan(5);
    }
  });

  it("mul.table-N always multiplies N by 1–9", () => {
    for (let n = 1; n <= 9; n++) {
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion("multiply", 1, `mul.table-${n}`);
        expect(q.a === n || q.b === n).toBe(true);
        const partner = q.a === n ? q.b : q.a;
        expect(partner).toBeGreaterThanOrEqual(1);
        expect(partner).toBeLessThanOrEqual(9);
        expect(q.answer).toBe(q.a * q.b);
      }
    }
  });
});

describe("compute", () => {
  it("matches each operation", () => {
    expect(compute("add", 2, 3)).toBe(5);
    expect(compute("subtract", 9, 4)).toBe(5);
    expect(compute("multiply", 6, 7)).toBe(42);
    expect(compute("divide", 56, 8)).toBe(7);
  });
});

describe("generateSession", () => {
  it("returns the count with no duplicate operand pairs", () => {
    const qs = generateSession("add", 2, "add.carry-single", 10);
    expect(qs).toHaveLength(10);
    const keys = qs.map((q) => `${q.a}×${q.b}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(qs.every((q) => q.subSkill === "add.carry-single")).toBe(true);
  });
});
