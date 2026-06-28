// One sub-skill mastery meter (§5, §10.1): label + bar + % + band color.
"use client";
import { motion } from "framer-motion";
import { masteryBand, MASTERY_BANDS } from "@/lib/constants";

interface MasteryMeterProps {
  label: string;
  mastery: number; // 0–100
  /** Highlight as the current practice target. */
  target?: boolean;
}

export function MasteryMeter({ label, mastery, target }: MasteryMeterProps) {
  const band = MASTERY_BANDS[masteryBand(mastery)];
  return (
    <div className={`rounded-2xl p-3 ${target ? "bg-white shadow-sm ring-2" : ""}`} style={target ? { ["--tw-ring-color" as string]: band.color } : undefined}>
      <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
        <span>
          {label} {target ? <span className="text-xs font-bold">← target</span> : null}
        </span>
        <span className="tabular-nums" style={{ color: band.color }}>
          {Math.round(mastery)}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: band.color }}
          initial={{ width: 0 }}
          animate={{ width: `${mastery}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
