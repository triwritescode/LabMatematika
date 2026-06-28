// Home (Beranda) — mascot greeting, streak, daily mission, operation labs (§9, §10).
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { OPERATIONS } from "@/lib/constants";
import { subSkillLabel } from "@/lib/subskills";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { Mascot } from "@/components/Mascot";
import { OperationCard } from "@/components/OperationCard";
import { StreakBadge } from "@/components/StreakBadge";

export default function Home() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  useEffect(() => hydrate(), [hydrate]);

  const name = progress.childName || "Teman";
  const mission = progress.dailyMission;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <Mascot pose="idle" message={strings.mascot.greet(name)} />

      <div className="flex items-center gap-3">
        <StreakBadge count={progress.streak.count} />
      </div>

      {mission.targetSubSkill ? (
        <div className="rounded-2xl bg-amber-50 p-4 text-amber-800">
          🎯 {strings.misiHarian}: {strings.targetHariIni(subSkillLabel(mission.targetSubSkill))}
        </div>
      ) : null}

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-700">{strings.petaKeahlian}</h2>
        <div className="grid grid-cols-2 gap-4">
          {OPERATIONS.map((op) => (
            <OperationCard key={op} operation={op} />
          ))}
        </div>
      </section>

      <nav className="mt-auto flex gap-3">
        <Link href="/progress" className="rounded-full bg-slate-100 px-4 py-2 font-medium text-slate-600">
          📊 {strings.progres}
        </Link>
      </nav>

      <p className="text-center text-xs text-slate-400">{strings.tagline}</p>
    </main>
  );
}
