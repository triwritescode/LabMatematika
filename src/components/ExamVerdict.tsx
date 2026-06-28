// Exam pass/fail verdict + routing (§3.3, §10.4).
"use client";
import { motion } from "framer-motion";
import type { ExamResult, Level } from "@/types";
import { OPERATION_META } from "@/lib/constants";
import { subSkillLabel } from "@/lib/subskills";
import { strings } from "@/lib/strings";
import { Mascot } from "@/components/Mascot";
import { Certificate } from "@/components/Certificate";
import { Confetti } from "@/components/Confetti";

interface ExamVerdictProps {
  result: ExamResult;
  childName: string;
  rank: string;
  onLanjut: () => void;
  onLatih: () => void;
  onRetry: () => void;
  onHome: () => void;
}

export function ExamVerdict({
  result,
  childName,
  rank,
  onLanjut,
  onLatih,
  onRetry,
  onHome,
}: ExamVerdictProps) {
  const meta = OPERATION_META[result.operation];
  const nextLevel = (result.level + 1) as Level;

  if (result.passed) {
    return (
      <div className="relative flex flex-col items-center gap-4 text-center">
        <Confetti active />
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="text-4xl font-extrabold"
          style={{ color: meta.color }}
        >
          🎉 {strings.lulus} {result.correct}/{result.total}
        </motion.p>
        <Mascot pose="celebrate" message={strings.mascot.examPass} />
        <p className="text-lg font-bold text-slate-700">{strings.naikLevel(nextLevel)}</p>
        <p className="font-semibold" style={{ color: meta.color }}>
          🏅 {strings.rankBaru(rank)}
        </p>
        <Certificate
          childName={childName}
          operationLabel={meta.label}
          level={result.level}
          rank={rank}
          accent={meta.color}
        />
        <div className="mt-2 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onLanjut}
            className="rounded-2xl py-3 text-lg font-bold text-white active:scale-95"
            style={{ backgroundColor: meta.color }}
          >
            ➡️ Lanjut ke Level {nextLevel}
          </button>
          <button type="button" onClick={onHome} className="rounded-2xl py-3 font-semibold text-slate-500">
            🏠 {strings.beranda}
          </button>
        </div>
      </div>
    );
  }

  const failing = result.failingSubSkill ? subSkillLabel(result.failingSubSkill) : "";
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-3xl font-extrabold text-slate-700">
        {strings.hampir} {result.correct}/{result.total}
      </p>
      <Mascot pose="sad" message={`Kamu masih goyah di: ${failing}.`} />
      <div className="mt-2 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onLatih}
          className="rounded-2xl py-3 text-lg font-bold text-white active:scale-95"
          style={{ backgroundColor: meta.color }}
        >
          ▶️ {strings.latih(failing)}
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 active:scale-95"
        >
          🔁 {strings.cobaUjianLagi}
        </button>
        <button type="button" onClick={onHome} className="rounded-2xl py-3 font-semibold text-slate-500">
          🏠 {strings.beranda}
        </button>
      </div>
    </div>
  );
}
