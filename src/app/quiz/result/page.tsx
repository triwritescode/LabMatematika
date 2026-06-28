// Result + rewards earned (§10.5). Phase 2 wires real session summary from store.
"use client";
import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { StarRating } from "@/components/StarRating";
import { strings } from "@/lib/strings";

export default function ResultPage() {
  // TODO(phase2): pull SessionResult (score/stars/coins/unlock/badges) from store.
  const stars = 3 as const;
  const score = 10;

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <Mascot pose="celebrate" message={strings.hebat} />
      <StarRating stars={stars} />
      <p className="text-xl font-bold">{strings.benarDari(score)}</p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-full bg-black/5 px-4 py-2">
          🏠 {strings.beranda}
        </Link>
      </div>
    </main>
  );
}
