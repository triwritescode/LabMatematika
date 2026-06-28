// Score a session + derive stars/coins/unlock (§10.5, §12).
import type { AnsweredQuestion, Mode } from "@/types";
import {
  CHALLENGE_UNLOCK_THRESHOLD,
  COINS_PER_CORRECT,
  starsForScore,
} from "@/lib/constants";

export interface ScoreSummary {
  score: number; // correct count
  total: number;
  stars: 0 | 1 | 2 | 3;
  coinsEarned: number;
  /** Only Challenge mode gates level unlock (§4.2, §12). */
  unlockedNextLevel: boolean;
  mistakes: AnsweredQuestion[];
}

export function scoreSession(answers: AnsweredQuestion[], mode: Mode): ScoreSummary {
  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  return {
    score,
    total,
    stars: starsForScore(score),
    coinsEarned: score * COINS_PER_CORRECT,
    unlockedNextLevel:
      mode === "tantangan" && score >= CHALLENGE_UNLOCK_THRESHOLD,
    mistakes: answers.filter((a) => !a.correct),
  };
}
