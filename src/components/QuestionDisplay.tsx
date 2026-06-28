// Big question prompt + current answer box (§10.3, §15: ≥28px).
import type { Question } from "@/types";
import { OPERATION_META } from "@/lib/constants";

interface QuestionDisplayProps {
  question: Question;
  /** Current typed value, shown in the answer box. */
  input: string;
}

export function QuestionDisplay({ question, input }: QuestionDisplayProps) {
  const { symbol } = OPERATION_META[question.operation];
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-4xl font-bold tabular-nums">
        {question.a} {symbol} {question.b} =
      </p>
      <div className="min-h-16 min-w-32 rounded-2xl border-2 border-dashed px-6 py-3 text-center text-4xl tabular-nums">
        {input || "?"}
      </div>
    </div>
  );
}
