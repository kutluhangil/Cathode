"use client";

import { cn } from "@/lib/cn";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}

/** Segment kontrolü — accent / duvar kâğıdı seçimi gibi az seçenekli alanlar. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-ui border border-border-soft bg-surface-0 p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-btn px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              active
                ? "bg-accent text-accent-ink"
                : "text-text-dim hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
