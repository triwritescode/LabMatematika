// Custom on-screen numpad — large child-friendly targets, no device keyboard (§10.3, §15).
"use client";

interface NumpadProps {
  onDigit: (d: number) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const KEYS = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0];

export function Numpad({ onDigit, onDelete, disabled }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(k)}
          // ≥ 56×56px targets per §15
          className="flex h-16 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-slate-800 shadow-sm transition active:scale-90 active:bg-slate-100 disabled:opacity-40"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="col-span-2 flex h-16 items-center justify-center gap-2 rounded-2xl bg-white text-2xl font-semibold text-slate-600 shadow-sm transition active:scale-95 active:bg-slate-100 disabled:opacity-40"
      >
        ⌫ Hapus
      </button>
    </div>
  );
}
