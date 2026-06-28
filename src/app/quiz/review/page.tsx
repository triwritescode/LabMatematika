// End-of-session mistake review (§6, §10). Phase 2 wires session mistakes from store.
"use client";
import Link from "next/link";

export default function ReviewPage() {
  // TODO(phase2): read the just-finished session's mistakes and render with WorkedExample.
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Yuk, lihat soal yang salah</h1>
      <p className="opacity-60">Belum ada soal yang salah.</p>
      <Link href="/quiz/result" className="rounded-full bg-blue-500 px-4 py-2 text-white">
        Lihat hasil
      </Link>
    </main>
  );
}
