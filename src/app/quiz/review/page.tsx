// End-of-session mistake review (§6, §10): each wrong answer with "Lihat caranya".
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AnsweredQuestion } from "@/types";
import { OPERATION_META } from "@/lib/constants";
import { useSessionStore } from "@/stores/useSessionStore";
import { WorkedExample } from "@/components/WorkedExample";

function MistakeCard({ item }: { item: AnsweredQuestion }) {
  const [open, setOpen] = useState(false);
  const { question, given } = item;
  const meta = OPERATION_META[question.operation];
  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold tabular-nums">
          {question.a} {meta.symbol} {question.b}
        </span>
        <span className="text-sm text-slate-500">
          Kamu: <span className="font-semibold text-red-500">{given ?? "–"}</span> · Jawaban:{" "}
          <span className="font-semibold text-green-600">{question.answer}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 text-sm font-medium"
        style={{ color: meta.color }}
      >
        {open ? "Tutup" : "Lihat caranya"}
      </button>
      {open ? (
        <div className="mt-2">
          <WorkedExample question={question} />
        </div>
      ) : null}
    </li>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const result = useSessionStore((s) => s.result);

  useEffect(() => {
    if (!result) router.replace("/");
  }, [result, router]);

  if (!result) return <main className="min-h-dvh" aria-busy />;

  const mistakes = result.mistakes;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-slate-800">Yuk, lihat soal yang salah</h1>

      {mistakes.length === 0 ? (
        <p className="rounded-2xl bg-green-50 p-4 text-green-700">
          🎉 Tidak ada yang salah. Hebat banget!
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {mistakes.map((m) => (
            <MistakeCard key={m.question.id} item={m} />
          ))}
        </ul>
      )}

      <Link
        href="/quiz/result"
        className="mt-auto rounded-2xl bg-slate-100 py-3 text-center font-bold text-slate-700 active:scale-95"
      >
        ← Kembali ke hasil
      </Link>
    </main>
  );
}
