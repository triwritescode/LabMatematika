// Winding-path level select; mascot sits on the current stop (§2.3, §10.2).
import type { Level, Operation } from "@/types";
import { LEVELS } from "@/lib/constants";
import { LevelStop, type LevelStatus } from "@/components/LevelStop";

interface AdventureMapProps {
  operation: Operation;
  /** Status per level keyed by level number. */
  statusByLevel: Record<number, LevelStatus>;
  starsByLevel?: Record<number, number>;
  onSelectLevel?: (level: Level) => void;
}

export function AdventureMap({
  statusByLevel,
  starsByLevel = {},
  onSelectLevel,
}: AdventureMapProps) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-3xl" aria-hidden>
        🏁
      </span>
      {LEVELS.map((lvl) => (
        <div key={lvl} className="ml-[calc(var(--stop)*1.5rem)]" style={{ ["--stop" as string]: lvl }}>
          <LevelStop
            level={lvl}
            status={statusByLevel[lvl] ?? "locked"}
            stars={starsByLevel[lvl] ?? 0}
            onSelect={() => onSelectLevel?.(lvl)}
          />
        </div>
      ))}
      <span className="text-3xl" aria-hidden>
        🏆
      </span>
    </div>
  );
}
