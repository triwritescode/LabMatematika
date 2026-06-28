import { describe, it, expect } from "vitest";
import { generateQuestion, generateSession, compute } from "@/lib/generator";
import type { Rng } from "@/lib/generator";
import { LEVELS } from "@/lib/constants";
import type { Operation } from "@/types";

// Deterministic RNG cycling through a fixed sequence for reproducible tests.
function seededRng(seq: number[]): Rng {
  let i = 0;
  return () => seq[i++ % seq.length];
}

const OPS: Operation[] = ["add", "subtract", "multiply", "divide"];

describe("generateQuestion invariants", () => {
  it("answer always equals compute(a,b) across all ops/levels", () => {
    const rng = seededRng([0.1, 0.42, 0.73, 0.9, 0.25]);
    for (const op of OPS) {
      for (const level of LEVELS) {
        const q = generateQuestion(op, level, { rng });
        expect(q.answer).toBe(compute(op, q.a, q.b));
      }
    }
  });

  it("subtraction never goes negative", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion("subtract", 4, {});
      expect(q.a).toBeGreaterThanOrEqual(q.b);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("division always yields a whole number", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion("divide", 4, {});
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.a % q.b).toBe(0);
    }
  });
});

describe("generateSession", () => {
  it("returns the requested count with no duplicate operand pairs", () => {
    const qs = generateSession("multiply", 3, 10, {});
    expect(qs).toHaveLength(10);
    const keys = qs.map((q) => `${q.a}×${q.b}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
