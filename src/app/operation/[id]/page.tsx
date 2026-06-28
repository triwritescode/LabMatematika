// Adventure map — pick level + mode for one operation world (§10.2).
"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Level, Mode, Operation } from "@/types";
import { LEVELS, OPERATION_META, OPERATIONS } from "@/lib/constants";
import { useProgressStore } from "@/stores/useProgressStore";
import { AdventureMap } from "@/components/AdventureMap";
import { ModeSelector } from "@/components/ModeSelector";
import type { LevelStatus } from "@/components/LevelStop";

export default function OperationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  const [mode, setMode] = useState<Mode>("latihan");

  useEffect(() => hydrate(), [hydrate]);

  const operation = (OPERATIONS.includes(id as Operation) ? id : "add") as Operation;
  const meta = OPERATION_META[operation];
  const opProgress = progress[operation];

  const { statusByLevel, starsByLevel } = useMemo(() => {
    const status: Record<number, LevelStatus> = {};
    const stars: Record<number, number> = {};
    for (const lvl of LEVELS) {
      const lp = opProgress.levels[String(lvl)];
      stars[lvl] = lp.bestStars;
      status[lvl] = !lp.unlocked ? "locked" : lp.bestScore > 0 ? "done" : "current";
    }
    return { statusByLevel: status, starsByLevel: stars };
  }, [opProgress]);

  function start(level: Level) {
    router.push(`/quiz/${operation}/${level}?mode=${mode}`);
  }

  return (
    <main
      className="mx-auto flex max-w-md flex-col gap-6 p-6"
      style={{ color: meta.color }}
    >
      <h1 className="text-2xl font-bold">Dunia {meta.label}</h1>
      <AdventureMap
        operation={operation}
        statusByLevel={statusByLevel}
        starsByLevel={starsByLevel}
        onSelectLevel={start}
      />
      <ModeSelector value={mode} onChange={setMode} />
    </main>
  );
}
