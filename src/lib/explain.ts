// Worked explanations in Bahasa Indonesia for "Lihat caranya" (§6).
// TODO(phase2): full column-by-column working per operation. Stub returns answer line.
import type { Question } from "@/types";
import { OPERATION_META } from "@/lib/constants";

export interface Explanation {
  /** Headline restating the correct equation. */
  heading: string;
  /** Step-by-step lines, child-friendly. */
  steps: string[];
}

export function explain(q: Question): Explanation {
  const { symbol } = OPERATION_META[q.operation];
  return {
    heading: `${q.a} ${symbol} ${q.b} = ${q.answer}`,
    // Phase 2 fills in carrying/borrowing/long-multiplication walkthroughs.
    steps: [`Jawaban yang benar adalah ${q.answer}.`],
  };
}
