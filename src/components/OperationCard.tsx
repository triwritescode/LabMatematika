// Tappable operation tile on Home, colored by world (§10.1, §15).
import Link from "next/link";
import type { Operation } from "@/types";
import { OPERATION_META } from "@/lib/constants";

export function OperationCard({ operation }: { operation: Operation }) {
  const meta = OPERATION_META[operation];
  return (
    <Link
      href={`/operation/${operation}`}
      className="flex flex-col items-center gap-1 rounded-3xl p-6 text-white shadow-lg active:scale-95"
      style={{ backgroundColor: meta.color }}
    >
      <span className="text-4xl" aria-hidden>
        {meta.emoji}
      </span>
      <span className="text-xl font-bold">{meta.label}</span>
    </Link>
  );
}
