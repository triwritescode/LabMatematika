// Level-Up Exam (§3.3) — test conditions: no hints, no explanations, no re-queue.
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { AnsweredQuestion, ExamResult, Level, Operation } from "@/types";
import { OPERATIONS, OPERATION_META } from "@/lib/constants";
import { assembleExam, gradeExam } from "@/lib/exam";
import { playSound } from "@/lib/audio";
import { useProgressStore } from "@/stores/useProgressStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { QuizRunner } from "@/components/QuizRunner";
import { ExamBanner } from "@/components/ExamBanner";

export default function ExamPage() {
  const params = useParams<{ operation: string; level: string }>();
  const router = useRouter();

  const operation = (OPERATIONS.includes(params.operation as Operation)
    ? params.operation
    : "add") as Operation;
  const level = (Number(params.level) || 1) as Level;
  const meta = OPERATION_META[operation];

  const hydrate = useProgressStore((s) => s.hydrate);
  const passExam = useProgressStore((s) => s.passExam);
  const bumpStreak = useProgressStore((s) => s.bumpStreak);
  const setResult = useSessionStore((s) => s.setResult);

  const [mounted, setMounted] = useState(false);
  const [questions] = useState(() => assembleExam(operation, level));

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single client-mount guard
    setMounted(true);
  }, [hydrate]);

  if (!mounted) return <main className="min-h-dvh" aria-busy />;

  function complete(answers: AnsweredQuestion[]) {
    const verdict = gradeExam(operation, level, answers);
    bumpStreak(new Date().toISOString().slice(0, 10));

    let newRank: string | undefined;
    if (verdict.passed) {
      passExam(operation, level);
      newRank = useProgressStore.getState().progress[operation].rank;
      playSound("examPass");
    }

    const result: ExamResult = {
      kind: "exam",
      operation,
      level,
      correct: verdict.correct,
      total: verdict.total,
      passed: verdict.passed,
      newRank,
      failingSubSkill: verdict.failingSubSkill,
      mistakes: verdict.mistakes,
    };
    setResult(result);
    router.replace("/result");
  }

  return (
    <QuizRunner
      questions={questions}
      accent={meta.color}
      allowExplanation={false}
      requeueWrong={false}
      header={<ExamBanner operation={operation} level={level} />}
      onComplete={complete}
    />
  );
}
