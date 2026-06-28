// Shared session runner for Diagnostic / Targeted Practice / Exam.
// Handles numpad input, instant feedback, optional explanation + re-queue, and
// reports each scored answer (for live mastery) plus the final answer list.
"use client";
import { ReactNode, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnsweredQuestion, DifficultyBias, Question } from "@/types";
import { adaptToEdge, pushResult, emptyPerformance } from "@/lib/adaptive";
import { playSound, unlockAudio } from "@/lib/audio";
import { strings } from "@/lib/strings";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { Numpad } from "@/components/Numpad";
import { ProgressBar } from "@/components/ProgressBar";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { WorkedExample } from "@/components/WorkedExample";
import { Mascot } from "@/components/Mascot";

interface QuizRunnerProps {
  questions: Question[];
  accent: string;
  header: ReactNode;
  allowExplanation: boolean;
  requeueWrong: boolean;
  /** Called once per scored answer (first encounter), for live mastery. */
  onAnswer?: (q: Question, correct: boolean, bias: DifficultyBias, streak: number) => void;
  onComplete: (answers: AnsweredQuestion[]) => void;
}

function pick(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function QuizRunner({
  questions,
  accent,
  header,
  allowExplanation,
  requeueWrong,
  onAnswer,
  onComplete,
}: QuizRunnerProps) {
  const [queue, setQueue] = useState<Question[]>(questions);
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [cheer, setCheer] = useState("");

  const answers = useRef<AnsweredQuestion[]>([]);
  const scoredIds = useRef<Set<string>>(new Set());
  const requeuedIds = useRef<Set<string>>(new Set());
  const perf = useRef(emptyPerformance());
  const correctStreak = useRef(0);

  const q = queue[pos];
  if (!q) return null;

  const total = queue.length;

  function submit() {
    if (input === "") return;
    unlockAudio();
    const given = Number(input);
    const correct = given === q.answer;

    if (!scoredIds.current.has(q.id)) {
      scoredIds.current.add(q.id);
      answers.current.push({ question: q, given, correct });
      const bias = adaptToEdge(perf.current);
      correctStreak.current = correct ? correctStreak.current + 1 : 0;
      onAnswer?.(q, correct, bias, correctStreak.current);
      perf.current = pushResult(perf.current, correct);
    }

    if (requeueWrong && !correct && !requeuedIds.current.has(q.id)) {
      requeuedIds.current.add(q.id);
      setQueue((prev) => [...prev, q]);
    }

    setCheer(correct ? pick(strings.mascot.cheer) : pick(strings.mascot.encourage));
    setLastCorrect(correct);
    playSound(correct ? "correct" : "wrong");
  }

  function next() {
    const nextPos = pos + 1;
    if (nextPos >= queue.length) {
      onComplete(answers.current);
      return;
    }
    setPos(nextPos);
    setInput("");
    setLastCorrect(null);
    setShowExplain(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-5" style={{ color: accent }}>
      <header className="flex flex-col gap-3">
        {header}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-500">
            {strings.soalDari(Math.min(pos + 1, total), total)}
          </span>
          <div className="flex-1">
            <ProgressBar current={pos + (lastCorrect === null ? 0 : 1)} total={total} />
          </div>
        </div>
      </header>

      <section
        className="flex flex-col items-center gap-6 rounded-3xl p-8 shadow-sm"
        style={{ backgroundColor: `${accent}14` }}
      >
        <QuestionDisplay question={q} input={input} />
      </section>

      <div className="mt-auto flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {lastCorrect === null ? (
            <motion.div
              key="numpad"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-4"
            >
              <Numpad
                onDigit={(d) => setInput((v) => (v + d).slice(0, 7))}
                onDelete={() => setInput((v) => v.slice(0, -1))}
              />
              <button
                type="button"
                disabled={input === ""}
                onClick={submit}
                className="rounded-2xl py-4 text-xl font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: accent }}
              >
                {strings.cekJawaban}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-4"
            >
              <Mascot pose={lastCorrect ? "happy" : "sad"} message={cheer} />
              <FeedbackOverlay
                correct={lastCorrect}
                answer={q.answer}
                onShowExplanation={
                  allowExplanation && !lastCorrect ? () => setShowExplain((s) => !s) : undefined
                }
              />
              {showExplain ? <WorkedExample question={q} /> : null}
              <button
                type="button"
                onClick={next}
                className="rounded-2xl py-4 text-xl font-bold text-white shadow-md transition active:scale-95"
                style={{ backgroundColor: accent }}
              >
                {pos + 1 >= total ? "Selesai →" : `${strings.lanjut} →`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
