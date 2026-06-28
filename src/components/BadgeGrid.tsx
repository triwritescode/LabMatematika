// Earned-vs-locked milestone badges (§2.4, §10.6).
import { BADGES } from "@/lib/rewards";

export function BadgeGrid({ earned }: { earned: string[] }) {
  const owned = new Set(earned);
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.values(BADGES).map((b) => {
        const has = owned.has(b.id);
        return (
          <div
            key={b.id}
            className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${has ? "bg-white shadow" : "bg-black/5 opacity-40"}`}
          >
            <span className="text-3xl" aria-hidden>
              {b.emoji}
            </span>
            <span className="text-sm font-medium">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
