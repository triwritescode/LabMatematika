// Skill Map (§10.1) — sub-skill mastery for a chosen level + exam gate.
// Any unlocked level (including already-passed ones) can be revisited and replayed.
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Level, Operation } from "@/types";
import { LEVELS, OPERATIONS, OPERATION_META } from "@/lib/constants";
import { levelSubSkills, subSkillLabel } from "@/lib/subskills";
import { levelReady, weakestSubSkill } from "@/lib/mastery";
import { activeLevel } from "@/lib/progression";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { Mascot } from "@/components/Mascot";
import { RankBadge } from "@/components/RankBadge";
import { SkillMap, type SkillRow } from "@/components/SkillMap";

export default function OperationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  const setDailyMission = useProgressStore((s) => s.setDailyMission);

  useEffect(() => hydrate(), [hydrate]);

  const operation = (OPERATIONS.includes(id as Operation) ? id : "add") as Operation;
  const meta = OPERATION_META[operation];
  const op = progress[operation];

  // Selected level: defaults to the active level, but the kid can pick any unlocked one.
  const [picked, setPicked] = useState<Level | null>(null);
  const level = picked ?? activeLevel(op);
  const state = op.levels[String(level)];
  const subs = levelSubSkills(operation, level);
  const target = weakestSubSkill(state, subs);
  const examReady = levelReady(state, subs);
  const hasPracticed = subs.some((s) => (state.subSkills[s]?.attempts ?? 0) > 0);

  // Set today's mission from this lab's current target.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDailyMission(operation, target, today);
  }, [operation, target, setDailyMission]);

  const rows: SkillRow[] = subs.map((sid) => ({
    id: sid,
    label: subSkillLabel(sid),
    mastery: state.subSkills[sid]?.mastery ?? 0,
  }));

  function startPractice() {
    // First time on this level → diagnostic to locate the edge (§3.1); otherwise practice.
    if (!hasPracticed) {
      router.push(`/diagnostic/${operation}/${level}`);
    } else {
      router.push(`/practice/${operation}/${level}?sub=${encodeURIComponent(target)}`);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-slate-500">
          ← {meta.labLabel}
        </Link>
        <RankBadge rank={op.rank} accent={meta.color} />
      </header>

      <Mascot pose="idle" message={strings.targetHariIni(subSkillLabel(target))} />

      {/* Level path — pick any unlocked level (passed levels stay open for replay). */}
      <div className="flex items-center gap-2">
        {LEVELS.map((lvl) => {
          const s = op.levels[String(lvl)];
          const selected = lvl === level;
          const label = s.examPassed ? "✅" : !s.unlocked ? "🔒" : `L${lvl}`;
          return (
            <button
              key={lvl}
              type="button"
              disabled={!s.unlocked}
              onClick={() => setPicked(lvl)}
              aria-current={selected}
              className="flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold transition active:scale-95 disabled:opacity-40"
              style={
                selected
                  ? { backgroundColor: meta.color, color: "white" }
                  : { backgroundColor: "#f1f5f9", color: "#475569" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-sm font-semibold text-slate-400">Level {level}</p>

      <SkillMap
        rows={rows}
        target={target}
        examReady={examReady}
        examPassed={state.examPassed}
        accent={meta.color}
        onPractice={startPractice}
        onExam={() => router.push(`/exam/${operation}/${level}`)}
      />
    </main>
  );
}
