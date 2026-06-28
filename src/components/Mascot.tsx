// Animated fox mascot "Hitung" + speech bubble (§2.1). Phase 3 adds Framer Motion poses.
import type { ReactNode } from "react";

export type MascotPose = "idle" | "happy" | "sad" | "celebrate";

interface MascotProps {
  pose?: MascotPose;
  message?: ReactNode;
}

export function Mascot({ pose = "idle", message }: MascotProps) {
  return (
    <div className="flex items-center gap-3" data-pose={pose}>
      <span className="text-5xl" aria-hidden>
        🦊
      </span>
      {message ? (
        <p className="rounded-2xl bg-white/80 px-4 py-2 text-lg shadow">{message}</p>
      ) : null}
    </div>
  );
}
