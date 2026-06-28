// Result — practice summary or exam verdict (§9, §10.4). Reads the session store.
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { OPERATION_META } from "@/lib/constants";
import { subSkillLabel } from "@/lib/subskills";
import { strings } from "@/lib/strings";
import { useSessionStore } from "@/stores/useSessionStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { Mascot } from "@/components/Mascot";
import { MasteryMeter } from "@/components/MasteryMeter";
import { ExamVerdict } from "@/components/ExamVerdict";

export default function ResultPage() {
  const router = useRouter();
  const result = useSessionStore((s) => s.result);
  const childName = useProgressStore((s) => s.progress.childName);
  const progress = useProgressStore((s) => s.progress);

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return <main className="min-h-dvh" aria-busy />;

  const meta = OPERATION_META[result.operation];

  // ── Exam verdict ──────────────────────────────────────────────────────────
  if (result.kind === "exam") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 p-6">
        <ExamVerdict
          result={result}
          childName={childName}
          rank={result.newRank ?? progress[result.operation].rank}
          onLanjut={() => router.push(`/operation/${result.operation}`)}
          onLatih={() =>
            router.push(
              `/practice/${result.operation}/${result.level}?sub=${encodeURIComponent(
                result.failingSubSkill ?? "",
              )}`,
            )
          }
          onRetry={() => router.push(`/operation/${result.operation}`)}
          onHome={() => router.push("/")}
        />
      </main>
    );
  }

  // ── Practice summary ──────────────────────────────────────────────────────
  const gained = Math.max(0, Math.round(result.masteryAfter - result.masteryBefore));
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <Mascot
          pose="celebrate"
          message={gained > 0 ? strings.mascot.masteryUp : pickEncourage()}
        />
      </motion.div>

      <p className="text-2xl font-extrabold text-slate-800">
        {result.correct}/{result.total} benar
      </p>

      <div className="w-full">
        <MasteryMeter label={subSkillLabel(result.targetSubSkill)} mastery={result.masteryAfter} />
        {gained > 0 ? (
          <p className="mt-1 text-sm font-semibold text-green-600">+{gained}% penguasaan 🎉</p>
        ) : null}
      </div>

      {result.mistakes.length > 0 ? (
        <Link href="/review" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
          👀 Lihat {result.mistakes.length} soal yang salah
        </Link>
      ) : null}

      <div className="mt-2 flex w-full flex-col gap-3">
        <div className="flex gap-3">
          <Link
            href={`/practice/${result.operation}/${result.level}?sub=${encodeURIComponent(result.targetSubSkill)}`}
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 active:scale-95"
          >
            🔄 {strings.ulangi}
          </Link>
          <Link
            href={`/operation/${result.operation}`}
            className="flex-1 rounded-2xl py-3 font-bold text-white active:scale-95"
            style={{ backgroundColor: meta.color }}
          >
            ➡️ {strings.lanjut}
          </Link>
        </div>
        <Link href="/" className="rounded-2xl py-3 font-semibold text-slate-500">
          🏠 {strings.beranda}
        </Link>
      </div>
    </main>
  );
}

function pickEncourage(): string {
  return strings.mascot.encourage[0];
}
