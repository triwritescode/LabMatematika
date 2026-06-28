// Progress — all operations, mastery meters, ranks (§9, §10.6).
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { LEVELS, OPERATIONS, OPERATION_META } from "@/lib/constants";
import { levelSubSkills } from "@/lib/subskills";
import { levelMastery } from "@/lib/mastery";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { RankBadge } from "@/components/RankBadge";

export default function ProgressPage() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  useEffect(() => hydrate(), [hydrate]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">📊 {strings.progres}</h1>
        <Link href="/" className="text-sm font-medium text-slate-500">
          ← {strings.beranda}
        </Link>
      </header>

      {OPERATIONS.map((op) => {
        const meta = OPERATION_META[op];
        const opp = progress[op];
        return (
          <section key={op} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Link href={`/operation/${op}`} className="font-bold" style={{ color: meta.color }}>
                {meta.emoji} {meta.labLabel}
              </Link>
              <RankBadge rank={opp.rank} accent={meta.color} />
            </div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => {
                const s = opp.levels[String(lvl)];
                const m = levelMastery(s, levelSubSkills(op, lvl));
                return (
                  <div
                    key={lvl}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    <span className="font-semibold">L{lvl}</span>
                    {s.examPassed ? (
                      <span aria-hidden>✅</span>
                    ) : !s.unlocked ? (
                      <span aria-hidden>🔒</span>
                    ) : (
                      <span className="tabular-nums text-slate-500">{m}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
