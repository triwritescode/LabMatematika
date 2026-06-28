// Printable certificate on exam pass (§7, §10.4).
import { strings } from "@/lib/strings";

interface CertificateProps {
  childName: string;
  operationLabel: string;
  level: number;
  rank: string;
  accent: string;
}

export function Certificate({ childName, operationLabel, level, rank, accent }: CertificateProps) {
  return (
    <div
      className="w-full rounded-3xl border-4 bg-white p-6 text-center"
      style={{ borderColor: accent }}
    >
      <p className="text-3xl">📜</p>
      <p className="mt-1 text-sm font-bold uppercase tracking-widest text-slate-400">
        {strings.sertifikat(operationLabel, level)}
      </p>
      <p className="mt-3 text-xl font-extrabold text-slate-800">
        {childName || "Ilmuwan Cilik"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        telah menguasai {operationLabel} Level {level}
      </p>
      <p className="mt-3 font-bold" style={{ color: accent }}>
        {rank}
      </p>
    </div>
  );
}
