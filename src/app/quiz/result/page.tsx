// Result + rewards earned (§10.5). Reads the finished SessionResult from the session store.
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Level } from "@/types";
import { OPERATION_META } from "@/lib/constants";
import { strings } from "@/lib/strings";
import { useSessionStore } from "@/stores/useSessionStore";
import { useProgressStore } from "@/stores/useProgressStore";
import { Mascot } from "@/components/Mascot";
import { StarRating } from "@/components/StarRating";
import { Confetti } from "@/components/Confetti";

export default function ResultPage() {
  const router = useRouter();
  const result = useSessionStore((s) => s.result);
  const streak = useProgressStore((s) => s.progress.streak.count);

  // No session (e.g. hard refresh) → back to home.
  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return <main className="min-h-dvh" aria-busy />;

  const meta = OPERATION_META[result.operation];
  const passed = result.score >= 5;
  const nextLevel = (result.level + 1) as Level;

  // "Lanjut": next level if unlocked, else back to the operation map.
  const lanjutHref = result.unlockedNextLevel
    ? `/quiz/${result.operation}/${nextLevel}?mode=${result.mode}`
    : `/operation/${result.operation}`;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <Confetti active={result.stars === 3} />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <Mascot pose="celebrate" message={passed ? strings.hebat : strings.ayoCobaLagi} />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 12 }}
      >
        <StarRating stars={result.stars} />
      </motion.div>

      <p className="text-2xl font-extrabold text-slate-800">
        {strings.benarDari(result.score)}
      </p>

      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-lg font-bold text-amber-700">
          🪙 {strings.koinPlus(result.coinsEarned)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 font-semibold text-orange-700">
          🔥 {strings.runtutanHari(streak)}
        </span>
        {result.unlockedNextLevel ? (
          <motion.span
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold text-white"
            style={{ backgroundColor: meta.color }}
          >
            🔓 {strings.levelTerbuka(nextLevel)}
          </motion.span>
        ) : null}
      </div>

      {result.mistakes.length > 0 ? (
        <Link
          href="/quiz/review"
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600"
        >
          👀 Lihat {result.mistakes.length} soal yang salah
        </Link>
      ) : null}

      <div className="mt-2 flex w-full flex-col gap-3">
        <div className="flex gap-3">
          <Link
            href={`/quiz/${result.operation}/${result.level}?mode=${result.mode}`}
            className="flex-1 rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 active:scale-95"
          >
            🔄 {strings.ulangi}
          </Link>
          <Link
            href={lanjutHref}
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
