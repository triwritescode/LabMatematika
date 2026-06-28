// One stop on the adventure map: locked / playable / completed (§10.2).
import type { Level } from "@/types";

export type LevelStatus = "locked" | "current" | "done";

interface LevelStopProps {
  level: Level;
  status: LevelStatus;
  stars?: number;
  onSelect?: () => void;
}

const ICON: Record<LevelStatus, string> = {
  locked: "🔒",
  current: "🦊",
  done: "⭐",
};

export function LevelStop({ level, status, stars = 0, onSelect }: LevelStopProps) {
  return (
    <button
      type="button"
      disabled={status === "locked"}
      onClick={onSelect}
      className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-lg shadow disabled:opacity-50"
    >
      <span aria-hidden>{ICON[status]}</span>
      <span className="font-semibold">Level {level}</span>
      {status === "done" ? (
        <span aria-hidden>{"⭐".repeat(stars)}</span>
      ) : null}
    </button>
  );
}
