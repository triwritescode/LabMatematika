// Coins, badges, streak + level-unlock logic (§2.4, §12).
import type { AppProgress, Level, SessionResult } from "@/types";

export interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
}

// Milestone badges (§2.4). Earning rules live in evaluateBadges (phase 3).
export const BADGES: Record<string, BadgeDef> = {
  jagoTambah: { id: "jagoTambah", label: "Jago Tambah", emoji: "🏅" },
  rajin7Hari: { id: "rajin7Hari", label: "Rajin 7 Hari", emoji: "🔥" },
  sempurna: { id: "sempurna", label: "Sempurna", emoji: "💯" },
  cepatTepat: { id: "cepatTepat", label: "Cepat Tepat", emoji: "⚡" },
  pejuangLatihan: { id: "pejuangLatihan", label: "Pejuang Latihan", emoji: "🎯" },
};

/** Same calendar day? Compares yyyy-mm-dd prefixes. */
function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function isYesterday(prev: string, today: string): boolean {
  const d = new Date(today.slice(0, 10));
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10) === prev.slice(0, 10);
}

/** Update streak for a completed session on `todayISO` (yyyy-mm-dd). */
export function updateStreak(progress: AppProgress, todayISO: string): AppProgress {
  const { lastActiveDate, count } = progress.streak;
  if (lastActiveDate && isSameDay(lastActiveDate, todayISO)) return progress;
  const next =
    lastActiveDate && isYesterday(lastActiveDate, todayISO) ? count + 1 : 1;
  return {
    ...progress,
    streak: { count: next, lastActiveDate: todayISO },
  };
}

/**
 * Apply a finished session to progress: coins, best score/stars, unlock next
 * level on a qualifying Challenge. Pure — returns a new AppProgress.
 * TODO(phase3): badge evaluation + daily mission completion.
 */
export function applySessionResult(
  progress: AppProgress,
  result: SessionResult,
): AppProgress {
  const op = result.operation;
  const opProgress = progress[op];
  const key = String(result.level);
  const prev = opProgress.levels[key];

  const levels = {
    ...opProgress.levels,
    [key]: {
      ...prev,
      bestScore: Math.max(prev.bestScore, result.score),
      bestStars: Math.max(prev.bestStars, result.stars),
      attempts: prev.attempts + 1,
      lastPlayedAt: new Date().toISOString(),
    },
  };

  if (result.unlockedNextLevel) {
    const nextKey = String((result.level + 1) as Level);
    if (levels[nextKey]) levels[nextKey] = { ...levels[nextKey], unlocked: true };
  }

  return {
    ...progress,
    [op]: { ...opProgress, levels },
    rewards: {
      ...progress.rewards,
      coins: progress.rewards.coins + result.coinsEarned,
      badges: [...new Set([...progress.rewards.badges, ...result.newBadges])],
    },
  } as AppProgress;
}
