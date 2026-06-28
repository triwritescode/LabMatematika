// Home (Beranda) — mascot greeting, streak, coins, operation picker (§10.1).
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { OPERATIONS } from "@/lib/constants";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { Mascot } from "@/components/Mascot";
import { OperationCard } from "@/components/OperationCard";
import { CoinCounter } from "@/components/CoinCounter";
import { StreakBadge } from "@/components/StreakBadge";

export default function Home() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);

  useEffect(() => hydrate(), [hydrate]);

  const name = progress.childName || "Teman";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <Mascot
        pose="idle"
        message={`${strings.mascot.greet(name)} ${strings.mascot.siapLatihan}`}
      />

      <div className="flex items-center gap-3">
        <StreakBadge count={progress.streak.count} />
        <CoinCounter coins={progress.rewards.coins} />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">{strings.pilihOperasi}</h2>
        <div className="grid grid-cols-2 gap-4">
          {OPERATIONS.map((op) => (
            <OperationCard key={op} operation={op} />
          ))}
        </div>
      </section>

      <nav className="flex gap-3">
        <Link href="/progress" className="rounded-full bg-black/5 px-4 py-2">
          📊 {strings.progres}
        </Link>
        <Link href="/shop" className="rounded-full bg-black/5 px-4 py-2">
          🛍️ {strings.toko}
        </Link>
        <Link href="/album" className="rounded-full bg-black/5 px-4 py-2">
          📔 {strings.albumStiker}
        </Link>
      </nav>
    </main>
  );
}
