// Test-conditions framing for the Level-Up Exam (§10.3).
import { OPERATION_META } from "@/lib/constants";
import { strings } from "@/lib/strings";
import type { Level, Operation } from "@/types";

export function ExamBanner({ operation, level }: { operation: Operation; level: Level }) {
  const meta = OPERATION_META[operation];
  return (
    <div className="rounded-2xl px-4 py-3 text-center text-white" style={{ backgroundColor: meta.color }}>
      <p className="text-sm font-bold uppercase tracking-wide">🧪 {strings.ujian}</p>
      <p className="text-lg font-extrabold">
        Level {level} · {meta.label}
      </p>
      <p className="text-sm opacity-90">{strings.tanpaBantuan}</p>
    </div>
  );
}
