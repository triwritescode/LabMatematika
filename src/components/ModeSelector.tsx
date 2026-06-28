// Pick Latihan / Tantangan / Latihan Campur (§4, §10.2).
"use client";
import type { Mode } from "@/types";
import { strings } from "@/lib/strings";

const MODE_LABEL: Record<Mode, string> = {
  latihan: strings.modeLatihan,
  tantangan: strings.modeTantangan,
  campur: strings.modeCampur,
};

interface ModeSelectorProps {
  value: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      {(Object.keys(MODE_LABEL) as Mode[]).map((mode) => (
        <label key={mode} className="flex items-center gap-2 text-lg">
          <input
            type="radio"
            name="mode"
            checked={value === mode}
            onChange={() => onChange(mode)}
          />
          {MODE_LABEL[mode]}
        </label>
      ))}
    </fieldset>
  );
}
