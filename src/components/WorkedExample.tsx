// Step-by-step worked explanation for "Lihat caranya" (§6).
import type { Question } from "@/types";
import { explain } from "@/lib/explain";

export function WorkedExample({ question }: { question: Question }) {
  const { heading, steps } = explain(question);
  return (
    <div className="rounded-2xl bg-amber-50 p-4">
      <p className="mb-2 text-xl font-bold">{heading}</p>
      <ol className="list-inside list-decimal space-y-1 text-lg">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
