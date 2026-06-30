"use client";

import { cn } from "@/lib/cn";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  id?: string;
}

/** Erişilebilir aç/kapa anahtarı (role=switch). */
export function Toggle({ checked, onChange, label, id }: Props) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
        checked
          ? "border-accent bg-accent/25"
          : "border-border bg-white/5 hover:bg-white/10",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200 ease-out-soft",
          checked
            ? "left-[22px] bg-accent shadow-glow"
            : "left-[3px] bg-text-dim",
        )}
      />
    </button>
  );
}
