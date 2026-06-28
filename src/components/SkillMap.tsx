// Skill Map — the heart of the app (§10.1). Mastery meters per sub-skill for the
// active level, target highlighted, plus the exam gate.
"use client";
import type { SubSkillId } from "@/types";
import { strings } from "@/lib/strings";
import { EXAM_READY_THRESHOLD } from "@/lib/constants";
import { MasteryMeter } from "@/components/MasteryMeter";

export interface SkillRow {
  id: SubSkillId;
  label: string;
  mastery: number;
}

interface SkillMapProps {
  rows: SkillRow[];
  target: SubSkillId;
  examReady: boolean;
  examPassed: boolean;
  accent: string;
  onPractice: () => void;
  onPracticeSub: (id: SubSkillId) => void;
  onExam: () => void;
}

export function SkillMap({
  rows,
  target,
  examReady,
  examPassed,
  accent,
  onPractice,
  onPracticeSub,
  onExam,
}: SkillMapProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {strings.penguasaan} sub-keahlian
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Ketuk kartu keahlian untuk berlatih lagi — termasuk yang sudah 100% 🔁.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <MasteryMeter
            key={r.id}
            label={r.label}
            mastery={r.mastery}
            target={r.id === target}
            onDrill={() => onPracticeSub(r.id)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onPractice}
        className="rounded-2xl py-4 text-lg font-bold text-white shadow-md transition active:scale-95"
        style={{ backgroundColor: accent }}
      >
        ▶️ {strings.latihanTerarah}
      </button>

      {examPassed ? (
        <div className="rounded-2xl bg-green-50 py-2 text-center text-sm font-bold text-green-700">
          ✅ Level ini sudah lulus — boleh diulang kapan saja
        </div>
      ) : null}

      {examReady || examPassed ? (
        <button
          type="button"
          onClick={onExam}
          className="rounded-2xl border-2 py-4 text-lg font-bold transition active:scale-95"
          style={{ borderColor: accent, color: accent }}
        >
          🧪 {examPassed ? "Ulangi Ujian" : strings.ujian}
        </button>
      ) : (
        <div className="rounded-2xl bg-slate-100 py-3 text-center font-semibold text-slate-400">
          🔒 Ujian (butuh semua ≥{EXAM_READY_THRESHOLD}%)
        </div>
      )}
    </div>
  );
}
