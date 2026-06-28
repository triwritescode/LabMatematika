// Daily streak chip (§10.1).
import { strings } from "@/lib/strings";

export function StreakBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 font-semibold">
      🔥 {strings.runtutanHari(count)}
    </span>
  );
}
