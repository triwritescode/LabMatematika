// Active practice screen (§10.3, §10.4): numpad input, instant feedback,
// Latihan re-queue + mid-session explanation, then finish → result.
"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { AnsweredQuestion, Level, Mode, Operation, Question, SessionResult } from "@/types";
import { LEVELS, OPERATION_META, OPERATIONS, QUESTIONS_PER_SESSION } from "@/lib/constants";
import { generateSession, generateMixedSession } from "@/lib/generator";
import { scoreSession } from "@/lib/scorer";
import { loadProgress } from "@/lib/storage";
import { playSound, unlockAudio } from "@/lib/audio";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { Numpad } from "@/components/Numpad";
import { ProgressBar } from "@/components/ProgressBar";
import { FeedbackOverlay } from "@/components/FeedbackOverlay";
import { WorkedExample } from "@/components/WorkedExample";
import { Mascot } from "@/components/Mascot";

function buildQueue(operation: Operation, level: Level, mode: Mode): Question[] {
  if (mode === "campur") {
    const prog = loadProgress();
    const unlocked = LEVELS.filter((l) => prog[operation].levels[String(l)].unlocked);
    return generateMixedSession(operation, unlocked, QUESTIONS_PER_SESSION);
  }
  return generateSession(operation, level, QUESTIONS_PER_SESSION);
}

function pick(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export default function QuizPage() {
  const params = useParams<{ operation: string; level: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const operation = (OPERATIONS.includes(params.operation as Operation)
    ? params.operation
    : "add") as Operation;
  const level = (Number(params.level) || 1) as Level;
  const mode = (search.get("mode") ?? "latihan") as Mode;
  const meta = OPERATION_META[operation];

  const hydrate = useProgressStore((s) => s.hydrate);
  const recordSession = useProgressStore((s) => s.recordSession);
  const setResult = useSessionStore((s) => s.setResult);

  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<Question[]>(() => buildQueue(operation, level, mode));
  const [pos, setPos] = useState(0);
  const [input, setInput] = useState("");
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [showExplain, setShowExplain] = useState(false);
  const [cheer, setCheer] = useState("");

  const scoredIds = useRef<Set<string>>(new Set());
  const requeuedIds = useRef<Set<string>>(new Set());

  // One-time client mount: hydrate persisted progress + avoid SSR random mismatch.
  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single client-mount guard
    setMounted(true);
  }, [hydrate]);

  const q = queue[pos];
  // Server + first client render show nothing until mounted (queue uses Math.random).
  if (!mounted || !q) {
    return <main className="min-h-dvh" aria-busy />;
  }

  const correctCount = answers.filter((a) => a.correct).length;
  const isLatihan = mode === "latihan";

  function submit() {
    if (input === "") return;
    unlockAudio();
    const given = Number(input);
    const correct = given === q.answer;

    if (!scoredIds.current.has(q.id)) {
      scoredIds.current.add(q.id);
      setAnswers((prev) => [...prev, { question: q, given, correct }]);
    }
    // Latihan: re-queue a wrong question once at the end (§4.1).
    if (isLatihan && !correct && !requeuedIds.current.has(q.id)) {
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
      finish();
      return;
    }
    setPos(nextPos);
    setInput("");
    setLastCorrect(null);
    setShowExplain(false);
  }

  function finish() {
    const summary = scoreSession(answers, mode);
    const result: SessionResult = {
      operation,
      level,
      mode,
      score: summary.score,
      stars: summary.stars,
      coinsEarned: summary.coinsEarned,
      unlockedNextLevel: summary.unlockedNextLevel,
      newBadges: [],
      mistakes: summary.mistakes,
    };
    setResult(result);
    recordSession(result);
    if (summary.unlockedNextLevel) playSound("levelup");
    router.replace("/quiz/result");
  }

  const total = queue.length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-5" style={{ color: meta.color }}>
      {/* Top bar */}
      <header className="flex flex-col gap-3 text-slate-800">
        <div className="flex items-center justify-between">
          <Link href={`/operation/${operation}`} className="text-sm font-medium opacity-70" style={{ color: meta.color }}>
            ← {meta.label} · Level {level}
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold tabular-nums text-amber-700">
            🪙 {correctCount * 10}
          </span>
        </div>
        <div className="flex items-center gap-3" style={{ color: meta.color }}>
          <span className="text-sm font-semibold text-slate-500">
            {strings.soalDari(Math.min(pos + 1, total), total)}
          </span>
          <div className="flex-1">
            <ProgressBar current={pos + (lastCorrect === null ? 0 : 1)} total={total} />
          </div>
        </div>
      </header>

      {/* Question card */}
      <section
        className="flex flex-col items-center gap-6 rounded-3xl p-8 shadow-sm"
        style={{ backgroundColor: `${meta.color}14` }}
      >
        <QuestionDisplay question={q} input={input} />
      </section>

      {/* Input / feedback area */}
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
                style={{ backgroundColor: meta.color }}
              >
                Cek Jawaban
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
                coins={10}
                onShowExplanation={
                  isLatihan && !lastCorrect ? () => setShowExplain((s) => !s) : undefined
                }
              />
              {showExplain ? <WorkedExample question={q} /> : null}
              <button
                type="button"
                onClick={next}
                className="rounded-2xl py-4 text-xl font-bold text-white shadow-md transition active:scale-95"
                style={{ backgroundColor: meta.color }}
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
