// Celebration confetti burst (§2.6). Phase 3 wires Framer Motion particles.
"use client";

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  // Placeholder: phase 3 replaces with animated particle burst.
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 flex items-start justify-center text-6xl"
    >
      🎉
    </div>
  );
}
