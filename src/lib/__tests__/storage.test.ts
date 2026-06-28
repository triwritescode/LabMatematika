import { describe, it, expect, beforeEach } from "vitest";
import { loadProgress, saveProgress, defaultProgress } from "@/lib/storage";
import { STORAGE_KEY } from "@/lib/constants";
import { levelSubSkills } from "@/lib/subskills";

beforeEach(() => window.localStorage.clear());

describe("loadProgress hardening", () => {
  it("returns defaults when nothing stored", () => {
    expect(loadProgress()).toEqual(defaultProgress());
  });

  it("survives corrupt JSON without throwing", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadProgress().add.levels["1"].unlocked).toBe(true);
  });

  it("rebuilds full structure when an operation is malformed", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ childName: "Adi", add: null, multiply: { levels: "nope" } }),
    );
    const p = loadProgress();
    expect(p.childName).toBe("Adi");
    // Missing/garbled operations fall back to a complete default shape.
    expect(Object.keys(p.add.levels)).toHaveLength(5);
    expect(levelSubSkills("multiply", 1).every((id) => id in p.multiply.levels["1"].subSkills)).toBe(
      true,
    );
  });

  it("overlays valid stored mastery and clamps out-of-range values", () => {
    const base = defaultProgress();
    base.add.levels["1"].subSkills["add.fact-3"].mastery = 999; // out of range
    base.add.levels["1"].subSkills["add.fact-4"].mastery = 55;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    const p = loadProgress();
    expect(p.add.levels["1"].subSkills["add.fact-3"].mastery).toBe(100);
    expect(p.add.levels["1"].subSkills["add.fact-4"].mastery).toBe(55);
  });

  it("round-trips a saved valid progress", () => {
    const base = defaultProgress();
    base.childName = "Sita";
    base.streak = { count: 3, lastActiveDate: "2026-06-28" };
    saveProgress(base);
    const p = loadProgress();
    expect(p.childName).toBe("Sita");
    expect(p.streak.count).toBe(3);
  });
});
