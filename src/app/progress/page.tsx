// Progress, badges, sub-skill weak spots (§10.6).
"use client";
import { useEffect } from "react";
import { OPERATIONS, OPERATION_META, LEVELS } from "@/lib/constants";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { StarRating } from "@/components/StarRating";
import { BadgeGrid } from "@/components/BadgeGrid";

export default function ProgressPage() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  useEffect(() => hydrate(), [hydrate]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">📊 Progres Kamu</h1>

      {OPERATIONS.map((op) => {
        const meta = OPERATION_META[op];
        return (
          <section key={op} className="flex flex-col gap-2">
            <h2 className="font-bold" style={{ color: meta.color }}>
              {meta.emoji} {meta.label}
            </h2>
            <div className="flex flex-wrap gap-3">
              {LEVELS.map((lvl) => {
                const lp = progress[op].levels[String(lvl)];
                return (
                  <div key={lvl} className="flex items-center gap-1 text-sm">
                    <span>L{lvl}</span>
                    {lp.unlocked ? (
                      <StarRating stars={lp.bestStars as 0 | 1 | 2 | 3} />
                    ) : (
                      <span aria-hidden>🔒</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <h2 className="mb-2 font-bold">🏅 {strings.lencana}</h2>
        <BadgeGrid earned={progress.rewards.badges} />
      </section>
    </main>
  );
}
