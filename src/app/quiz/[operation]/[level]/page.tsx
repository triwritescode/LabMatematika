// Active practice screen — generate session, numpad input, inline feedback (§10.3, §10.4).
// Phase 1 scaffold: wires generator + numpad + feedback. Adaptive/sound land later.
"use client";
import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Level, Mode, Operation } from "@/types";
import { QUESTIONS_PER_SESSION } from "@/lib/constants";
import { generateSession } from "@/lib/generator";
import { strings } from "@/lib/strings";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { Numpad } from "@/components/Numpad";
import { ProgressBar } from "@/components/ProgressBar";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";

export default function QuizPage() {
  const params = useParams<{ operation: string; level: string }>();
  const search = useSearchParams();

  const operation = params.operation as Operation;
  const level = Number(params.level) as Level;
  const mode = (search.get("mode") ?? "latihan") as Mode;

  const questions = useMemo(
    () => generateSession(operation, level, QUESTIONS_PER_SESSION),
    [operation, level],
  );

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const q = questions[index];
  if (!q) return null;

  function submit() {
    setLastCorrect(Number(input) === q.answer);
  }

  function next() {
    setIndex((i) => i + 1);
    setInput("");
    setLastCorrect(null);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm">{strings.soalDari(index + 1, questions.length)}</p>
        <ProgressBar current={index + 1} total={questions.length} />
      </header>

      <QuestionDisplay question={q} input={input} />

      {lastCorrect === null ? (
        <>
          <Numpad
            onDigit={(d) => setInput((v) => (v + d).slice(0, 6))}
            onDelete={() => setInput((v) => v.slice(0, -1))}
          />
          <button
            type="button"
            disabled={input === ""}
            onClick={submit}
            className="rounded-full bg-blue-500 py-3 text-lg font-bold text-white disabled:opacity-40"
          >
            {strings.lanjut}
          </button>
        </>
      ) : (
        <>
          <FeedbackOverlay correct={lastCorrect} answer={q.answer} coins={10} />
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-blue-500 py-3 text-lg font-bold text-white"
          >
            {strings.lanjut}
          </button>
        </>
      )}

      <p className="text-center text-xs opacity-50">mode: {mode}</p>
    </main>
  );
}
