// Rank badge earned per operation (§7, §17 ladder).
export function RankBadge({ rank, accent }: { rank: string; accent?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-white"
      style={{ backgroundColor: accent ?? "#64748b" }}
    >
      🏅 {rank}
    </span>
  );
}
