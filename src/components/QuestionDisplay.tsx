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
    <div className="flex flex-col items-center gap-5">
      <p className="text-5xl font-extrabold tabular-nums text-slate-800">
        {question.a} <span className="opacity-70">{symbol}</span> {question.b}
      </p>
      <div
        className="flex min-h-20 min-w-40 items-center justify-center rounded-2xl border-4 border-current bg-white px-6 text-5xl font-extrabold tabular-nums"
        aria-live="polite"
      >
        {input ? (
          <span className="text-slate-800">{input}</span>
        ) : (
          <span className="opacity-40">?</span>
        )}
      </div>
    </div>
  );
}
