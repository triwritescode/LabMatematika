// Inline correct/wrong feedback after an answer (§10.4). Phase 3 adds star-burst + sound.
import { strings } from "@/lib/strings";

interface FeedbackOverlayProps {
  correct: boolean;
  /** Correct answer, shown when wrong. */
  answer: number;
  coins?: number;
  /** Practice mode only — reveals "Lihat caranya". */
  onShowExplanation?: () => void;
}

export function FeedbackOverlay({
  correct,
  answer,
  coins = 0,
  onShowExplanation,
}: FeedbackOverlayProps) {
  if (correct) {
    return (
      <div className="rounded-2xl bg-green-500 px-4 py-3 text-white">
        ✅ {strings.benar} +{coins} 🪙
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-red-500 px-4 py-3 text-white">
      ❌ {strings.belumTepat}. {strings.yangBenar(answer)}
      {onShowExplanation ? (
        <button type="button" onClick={onShowExplanation} className="ml-2 underline">
          {strings.lihatCaranya}
        </button>
      ) : null}
    </div>
  );
}
