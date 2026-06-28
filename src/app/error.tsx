// Route error boundary — a render crash shows a friendly retry instead of a blank
// screen (kids shouldn't hit a dead end). Must be a Client Component.
"use client";
import { useEffect } from "react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Surface for debugging; no PII, no network.
    console.error("App error boundary caught a render error");
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="text-5xl" aria-hidden>
        🦊
      </span>
      <h1 className="text-xl font-bold text-slate-800">Aduh, ada yang error.</h1>
      <p className="text-slate-500">Yuk coba lagi ya!</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-2xl bg-blue-500 px-6 py-3 font-bold text-white active:scale-95"
      >
        🔄 Coba lagi
      </button>
    </main>
  );
}
