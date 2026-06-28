// Worked explanations in Bahasa Indonesia for "Lihat caranya" (§6).
// Child-friendly, column-aware for add/subtract; concept hints for multiply/divide.
import type { Question } from "@/types";
import { OPERATION_META } from "@/lib/constants";

export interface Explanation {
  /** Headline restating the correct equation. */
  heading: string;
  /** Step-by-step lines, child-friendly. */
  steps: string[];
}

function digits(n: number): number[] {
  // Least-significant first, e.g. 65 → [5, 6].
  return String(n).split("").reverse().map(Number);
}

function explainAdd(a: number, b: number, answer: number): string[] {
  const da = digits(a);
  const db = digits(b);
  const cols = Math.max(da.length, db.length);
  const steps: string[] = ["Jumlahkan dari kolom satuan (paling kanan) dulu."];
  let carry = 0;
  for (let i = 0; i < cols; i++) {
    const x = da[i] ?? 0;
    const y = db[i] ?? 0;
    const sum = x + y + carry;
    if (sum >= 10) {
      steps.push(`${x} + ${y}${carry ? ` + simpanan ${carry}` : ""} = ${sum}. Tulis ${sum % 10}, simpan 1.`);
      carry = 1;
    } else {
      steps.push(`${x} + ${y}${carry ? ` + simpanan ${carry}` : ""} = ${sum}. Tulis ${sum}.`);
      carry = 0;
    }
  }
  if (carry) steps.push("Tulis simpanan terakhir di depan.");
  steps.push(`Hasilnya: ${answer}.`);
  return steps;
}

function explainSubtract(answer: number): string[] {
  return [
    "Kurangkan dari kolom satuan (paling kanan) dulu.",
    "Kalau angka atas lebih kecil, pinjam 1 dari kolom sebelah kiri.",
    `Hasilnya: ${answer}.`,
  ];
}

function explainMultiply(a: number, b: number, answer: number): string[] {
  return [
    `${a} × ${b} berarti ${a} dijumlahkan sebanyak ${b} kali.`,
    `Atau pakai tabel perkalian.`,
    `Hasilnya: ${answer}.`,
  ];
}

function explainDivide(a: number, b: number, answer: number): string[] {
  return [
    `${a} ÷ ${b} berarti membagi ${a} ke dalam ${b} kelompok sama banyak.`,
    `Cek: ${answer} × ${b} = ${a}. Benar!`,
    `Hasilnya: ${answer}.`,
  ];
}

export function explain(q: Question): Explanation {
  const { symbol } = OPERATION_META[q.operation];
  const heading = `${q.a} ${symbol} ${q.b} = ${q.answer}`;
  switch (q.operation) {
    case "add":
      return { heading, steps: explainAdd(q.a, q.b, q.answer) };
    case "subtract":
      return { heading, steps: explainSubtract(q.answer) };
    case "multiply":
      return { heading, steps: explainMultiply(q.a, q.b, q.answer) };
    case "divide":
      return { heading, steps: explainDivide(q.a, q.b, q.answer) };
  }
}
