// Diagnostic (§3.1) — locate the weakest sub-skill, then route to Targeted Practice.
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { AnsweredQuestion, Level, Operation } from "@/types";
import { OPERATIONS, OPERATION_META } from "@/lib/constants";
import { assembleDiagnostic, analyzeDiagnostic } from "@/lib/diagnostic";
import { strings } from "@/lib/strings";
import { QuizRunner } from "@/components/QuizRunner";

export default function DiagnosticPage() {
  const params = useParams<{ operation: string; level: string }>();
  const router = useRouter();

  const operation = (OPERATIONS.includes(params.operation as Operation)
    ? params.operation
    : "add") as Operation;
  const level = (Number(params.level) || 1) as Level;
  const meta = OPERATION_META[operation];

  const [mounted, setMounted] = useState(false);
  const [questions] = useState(() => assembleDiagnostic(operation, level));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- single client-mount guard
    setMounted(true);
  }, []);

  if (!mounted) return <main className="min-h-dvh" aria-busy />;

  function complete(answers: AnsweredQuestion[]) {
    const target = analyzeDiagnostic(operation, level, answers);
    router.replace(`/practice/${operation}/${level}?sub=${encodeURIComponent(target)}`);
  }

  return (
    <QuizRunner
      questions={questions}
      accent={meta.color}
      allowExplanation={false}
      requeueWrong={false}
      header={
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: meta.color }}>
            🔍 {strings.diagnostik} · {meta.labLabel}
          </span>
          <span className="text-sm text-slate-400">Level {level}</span>
        </div>
      }
      onComplete={complete}
    />
  );
}
