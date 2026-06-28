// Session progress bar — question n of total (§10.3).
interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-black/10"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div className="h-full bg-current transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
