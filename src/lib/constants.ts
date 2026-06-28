// App-wide constants. See specs §4, §5, §7, §12, §15.
import type { Operation, Level } from "@/types";

export const QUESTIONS_PER_SESSION = 10;
export const DIAGNOSTIC_SIZE = 8;

export const LEVELS: readonly Level[] = [1, 2, 3, 4, 5] as const;

export const OPERATIONS: readonly Operation[] = [
  "add",
  "subtract",
  "multiply",
  "divide",
] as const;

interface OperationMeta {
  id: Operation;
  /** Bahasa Indonesia label. */
  label: string;
  /** "Lab Tambah" etc. */
  labLabel: string;
  symbol: string;
  emoji: string;
  /** Lab/world color (§15). */
  color: string;
}

export const OPERATION_META: Record<Operation, OperationMeta> = {
  add: { id: "add", label: "Tambah", labLabel: "Lab Tambah", symbol: "+", emoji: "➕", color: "#3B82F6" },
  subtract: { id: "subtract", label: "Kurang", labLabel: "Lab Kurang", symbol: "−", emoji: "➖", color: "#EF4444" },
  multiply: { id: "multiply", label: "Kali", labLabel: "Lab Kali", symbol: "×", emoji: "✖️", color: "#22C55E" },
  divide: { id: "divide", label: "Bagi", labLabel: "Lab Bagi", symbol: "÷", emoji: "➗", color: "#EAB308" },
};

// ── Mastery (§5) ─────────────────────────────────────────────────────────────

export type MasteryBand = "belum" | "sedang" | "dikuasai";

export const MASTERY_BANDS: Record<MasteryBand, { label: string; color: string }> = {
  belum: { label: "Belum dikuasai", color: "#EF4444" },
  sedang: { label: "Sedang dilatih", color: "#EAB308" },
  dikuasai: { label: "Dikuasai", color: "#22C55E" },
};

export function masteryBand(mastery: number): MasteryBand {
  if (mastery >= 81) return "dikuasai";
  if (mastery >= 41) return "sedang";
  return "belum";
}

/** A level's exam unlocks when ALL its sub-skills reach this mastery (§5). */
export const EXAM_READY_THRESHOLD = 70;

// ── Exam pass bar (§3.3, §12) ────────────────────────────────────────────────

export const EXAM_MIN_CORRECT = 9; // ≥ 9/10
export const EXAM_MAX_CORE_MISSES = 1; // ≤ 1 miss on the core sub-skill

// ── Ranks (§7, §17) ──────────────────────────────────────────────────────────

// Rank ladder per operation, indexed by number of level exams passed.
export const RANK_LADDER = [
  "Asisten Lab", // 0 exams passed
  "Ilmuwan Cilik", // 1
  "Ahli Hitung", // 2–3
  "Profesor Matematika", // 4+
] as const;

export function rankForExamsPassed(passed: number): string {
  if (passed >= 4) return RANK_LADDER[3];
  if (passed >= 2) return RANK_LADDER[2];
  if (passed >= 1) return RANK_LADDER[1];
  return RANK_LADDER[0];
}

export const STORAGE_KEY = "labmatematika:progress:v2";
