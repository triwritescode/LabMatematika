// Targeted Practice (§3.2) — drill ONE sub-skill, live mastery, explanation + re-queue.
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { AnsweredQuestion, Level, Operation, PracticeResult, SubSkillId } from "@/types";
import { OPERATIONS, OPERATION_META, QUESTIONS_PER_SESSION } from "@/lib/constants";
import { levelSubSkills, subSkillLabel } from "@/lib/subskills";
import { weakestSubSkill } from "@/lib/mastery";
import { generateSession } from "@/lib/generator";
import { loadProgress } from "@/lib/storage";
import { useProgressStore } from "@/stores/useProgressStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { QuizRunner } from "@/components/QuizRunner";

export default function PracticePage() {
  const params = useParams<{ operation: string; level: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const operation = (OPERATIONS.includes(params.operation as Operation)
    ? params.operation
    : "add") as Operation;
  const level = (Number(params.level) || 1) as Level;
  const meta = OPERATION_META[operation];

  const hydrate = useProgressStore((s) => s.hydrate);
  const applyAnswer = useProgressStore((s) => s.applyAnswer);
  const bumpStreak = useProgressStore((s) => s.bumpStreak);
  const setResult = useSessionStore((s) => s.setResult);

  // Read persisted state once, then derive target + starting mastery from it.
  const [{ target, masteryBefore }] = useState(() => {
    const levelState = loadProgress()[operation].levels[String(level)];
    const sub =
      (search.get("sub") as SubSkillId) ||
      weakestSubSkill(levelState, levelSubSkills(operation, level));
    return { target: sub, masteryBefore: levelState.subSkills[sub]?.mastery ?? 0 };
  });

  const [mounted, setMounted] = useState(false);
  const [questions] = useState(() =>
    generateSession(operation, level, target, QUESTIONS_PER_SESSION),
  );

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single client-mount guard
    setMounted(true);
  }, [hydrate]);

  if (!mounted) return <main className="min-h-dvh" aria-busy />;

  function complete(answers: AnsweredQuestion[]) {
    bumpStreak(new Date().toISOString().slice(0, 10));
    const after =
      useProgressStore.getState().progress[operation].levels[String(level)].subSkills[target]
        ?.mastery ?? masteryBefore;
    const result: PracticeResult = {
      kind: "practice",
      operation,
      level,
      targetSubSkill: target,
      correct: answers.filter((a) => a.correct).length,
      total: answers.length,
      masteryBefore,
      masteryAfter: after,
      mistakes: answers.filter((a) => !a.correct),
    };
    setResult(result);
    router.replace("/result");
  }

  return (
    <QuizRunner
      questions={questions}
      accent={meta.color}
      allowExplanation
      requeueWrong
      header={
        <div className="flex items-center justify-between">
          <Link href={`/operation/${operation}`} className="text-sm font-medium" style={{ color: meta.color }}>
            ← {meta.labLabel}
          </Link>
          <span className="text-sm font-bold text-slate-600">
            Latihan: {subSkillLabel(target)}
          </span>
        </div>
      }
      onAnswer={(_q, correct, bias, streak) =>
        applyAnswer(operation, level, target, correct, bias, streak)
      }
      onComplete={complete}
    />
  );
}
