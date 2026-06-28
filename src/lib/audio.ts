// HTML5 Audio with iOS-safe unlock: audio can only start after a user tap (§8).
// Preload clips, unlock the context on first interaction, then play on demand.
"use client";

export type SoundName = "correct" | "wrong" | "levelup" | "coin";

const SOURCES: Record<SoundName, string> = {
  correct: "/sounds/correct.mp3",
  wrong: "/sounds/wrong.mp3",
  levelup: "/sounds/levelup.mp3",
  coin: "/sounds/coin.mp3",
};

let unlocked = false;
const pool = new Map<SoundName, HTMLAudioElement>();

function el(name: SoundName): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  let a = pool.get(name);
  if (!a) {
    a = new Audio(SOURCES[name]);
    a.preload = "auto";
    pool.set(name, a);
  }
  return a;
}

/** Call once from the first user tap to satisfy iOS autoplay rules. */
export function unlockAudio(): void {
  if (unlocked || typeof Audio === "undefined") return;
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    const a = el(name);
    if (!a) continue;
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
      })
      .catch(() => {
        /* still locked; will retry on next tap */
      });
  }
  unlocked = true;
}

export function playSound(name: SoundName): void {
  const a = el(name);
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {
    /* blocked until unlockAudio runs — non-fatal */
  });
}
