"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PARTIAL_DECIMAL = /^\d*\.?\d*$/;

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  className?: string;
  suffix?: React.ReactNode;
  id?: string;
  "aria-label"?: string;
};

function valueToDisplay(value: number): string {
  return value > 0 ? String(value) : "";
}

export function DecimalInput({
  value,
  onChange,
  min = 0.1,
  className,
  suffix,
  id,
  "aria-label": ariaLabel,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  const displayValue = draft ?? valueToDisplay(value);

  function commitFromRaw(raw: string) {
    if (raw === "" || raw === ".") {
      onChange(0);
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replace(",", ".");
          if (!PARTIAL_DECIMAL.test(raw)) return;
          setDraft(raw);
          commitFromRaw(raw);
        }}
        onBlur={() => {
          const raw = draft ?? valueToDisplay(value);
          if (raw === "" || raw === "." || Number.isNaN(Number(raw))) {
            onChange(min);
          } else {
            onChange(Math.max(min, Number(raw)));
          }
          setDraft(null);
        }}
        className={cn(
          "w-full rounded-lg border border-[#3a3a36] bg-[#161614] px-3 py-2.5 text-base font-semibold text-white outline-none transition-colors focus:border-[#e30311]",
          suffix ? "pr-16" : "pr-3",
          className,
        )}
      />
      {suffix}
    </div>
  );
}
