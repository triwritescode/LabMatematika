// Sub-skill catalog + detection (§4). Sub-skills are the unit deliberate practice
// targets; mastery is tracked per (level, sub-skill).
import type { Level, Operation, SubSkillId } from "@/types";

export interface SubSkillDef {
  id: SubSkillId;
  operation: Operation;
  /** Bahasa Indonesia label shown on the Skill Map. */
  label: string;
}

// Catalog — id → definition. Ids are namespaced by operation.
export const SUBSKILLS: Record<SubSkillId, SubSkillDef> = {
  // Addition
  "add.facts": { id: "add.facts", operation: "add", label: "Fakta dasar" },
  "add.no-carry": { id: "add.no-carry", operation: "add", label: "Tanpa simpan" },
  "add.carry-single": { id: "add.carry-single", operation: "add", label: "Menyimpan 1 angka" },
  "add.carry-multi": { id: "add.carry-multi", operation: "add", label: "Menyimpan banyak" },
  // Subtraction
  "sub.facts": { id: "sub.facts", operation: "subtract", label: "Fakta dasar" },
  "sub.no-borrow": { id: "sub.no-borrow", operation: "subtract", label: "Tanpa meminjam" },
  "sub.borrow-single": { id: "sub.borrow-single", operation: "subtract", label: "Meminjam 1 angka" },
  "sub.borrow-zero": { id: "sub.borrow-zero", operation: "subtract", label: "Meminjam lewat nol" },
  // Multiplication
  "mul.facts": { id: "mul.facts", operation: "multiply", label: "Tabel perkalian" },
  "mul.2x1": { id: "mul.2x1", operation: "multiply", label: "2 angka × 1 angka" },
  "mul.2x2": { id: "mul.2x2", operation: "multiply", label: "2 angka × 2 angka" },
  "mul.multi": { id: "mul.multi", operation: "multiply", label: "Angka besar" },
  // Division
  "div.facts": { id: "div.facts", operation: "divide", label: "Fakta dasar" },
  "div.2x1": { id: "div.2x1", operation: "divide", label: "2 angka ÷ 1 angka" },
  "div.long": { id: "div.long", operation: "divide", label: "Pembagi 2 angka" },
  "div.large": { id: "div.large", operation: "divide", label: "Angka besar" },
};

// Per-number fact families for Level 1 (§4): each number 1–9 is its own sub-skill,
// so the kid practices and is tested on every number until ALL are mastered.
export const FACT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** Sub-skill id for one number's facts, e.g. addFactId(5) → "add.fact-5". */
export const addFactId = (n: number): SubSkillId => `add.fact-${n}`;
export const mulTableId = (n: number): SubSkillId => `mul.table-${n}`;

/** Parse the number out of a per-number fact id, or null if not one. */
export function factNumber(id: SubSkillId): number | null {
  const m = /^(?:add\.fact|mul\.table)-(\d)$/.exec(id);
  return m ? Number(m[1]) : null;
}

for (const n of FACT_NUMBERS) {
  SUBSKILLS[addFactId(n)] = { id: addFactId(n), operation: "add", label: `Tambah ${n}` };
  SUBSKILLS[mulTableId(n)] = { id: mulTableId(n), operation: "multiply", label: `Tabel ${n}` };
}

const ADD_L1 = FACT_NUMBERS.map(addFactId);
const MUL_L1 = FACT_NUMBERS.map(mulTableId);

// Full ordered sub-skill list per operation (Skill Map display order, easy → hard).
export const OPERATION_SUBSKILLS: Record<Operation, SubSkillId[]> = {
  add: ["add.facts", "add.no-carry", "add.carry-single", "add.carry-multi"],
  subtract: ["sub.facts", "sub.no-borrow", "sub.borrow-single", "sub.borrow-zero"],
  multiply: ["mul.facts", "mul.2x1", "mul.2x2", "mul.multi"],
  divide: ["div.facts", "div.2x1", "div.long", "div.large"],
};

// Sub-skills assigned to each level. Index 0 = the level's CORE sub-skill (§3.3).
export const LEVEL_SUBSKILLS: Record<Operation, Record<Level, SubSkillId[]>> = {
  add: {
    1: ADD_L1,
    2: ["add.carry-single", "add.no-carry"],
    3: ["add.carry-multi", "add.carry-single"],
    4: ["add.carry-multi", "add.carry-single"],
    5: ["add.carry-multi", "add.carry-single", "add.no-carry", "add.facts"],
  },
  subtract: {
    1: ["sub.facts"],
    2: ["sub.borrow-single", "sub.no-borrow"],
    3: ["sub.borrow-zero", "sub.borrow-single"],
    4: ["sub.borrow-zero", "sub.borrow-single"],
    5: ["sub.borrow-zero", "sub.borrow-single", "sub.no-borrow", "sub.facts"],
  },
  multiply: {
    1: MUL_L1,
    2: ["mul.2x1"],
    3: ["mul.2x2", "mul.2x1"],
    4: ["mul.multi", "mul.2x2"],
    5: ["mul.multi", "mul.2x2", "mul.2x1", "mul.facts"],
  },
  divide: {
    1: ["div.facts"],
    2: ["div.2x1"],
    3: ["div.long", "div.2x1"],
    4: ["div.large", "div.long"],
    5: ["div.large", "div.long", "div.2x1", "div.facts"],
  },
};

export function levelSubSkills(operation: Operation, level: Level): SubSkillId[] {
  return LEVEL_SUBSKILLS[operation][level];
}

/** The core sub-skill the level's exam weights toward (§3.3, §12). */
export function coreSubSkill(operation: Operation, level: Level): SubSkillId {
  return LEVEL_SUBSKILLS[operation][level][0];
}

export function subSkillLabel(id: SubSkillId): string {
  return SUBSKILLS[id]?.label ?? id;
}

// ── Column arithmetic detection (used by the constrained generator) ──────────

function digits(n: number): number[] {
  // Least-significant first, e.g. 65 → [5, 6].
  return String(Math.abs(n)).split("").reverse().map(Number);
}

/** Number of columns that carry when adding a + b. */
export function countCarries(a: number, b: number): number {
  const da = digits(a);
  const db = digits(b);
  const cols = Math.max(da.length, db.length);
  let carry = 0;
  let count = 0;
  for (let i = 0; i < cols; i++) {
    const sum = (da[i] ?? 0) + (db[i] ?? 0) + carry;
    if (sum >= 10) {
      count++;
      carry = 1;
    } else {
      carry = 0;
    }
  }
  return count;
}

/** Number of columns that borrow when subtracting a - b (a >= b). */
export function countBorrows(a: number, b: number): number {
  const da = digits(a);
  const db = digits(b);
  let borrow = 0;
  let count = 0;
  for (let i = 0; i < da.length; i++) {
    const top = da[i] - borrow;
    const bottom = db[i] ?? 0;
    if (top < bottom) {
      count++;
      borrow = 1;
    } else {
      borrow = 0;
    }
  }
  return count;
}

/** True if subtracting forces a borrow through a zero column (e.g. 200 − 45). */
export function hasBorrowAcrossZero(a: number, b: number): boolean {
  if (countBorrows(a, b) === 0) return false;
  const da = digits(a);
  // A zero somewhere below the top digit means a chained borrow passes through it.
  return da.slice(0, -1).includes(0);
}
