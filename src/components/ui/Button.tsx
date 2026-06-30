"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "solid" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[8px] px-3.5 py-2 text-sm font-medium transition-colors duration-150 outline-none disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  ghost: "text-text-dim hover:text-text hover:bg-white/5",
  solid: "bg-accent text-accent-ink hover:brightness-110 shadow-glow",
  outline:
    "border border-border text-text hover:border-accent hover:text-accent",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "ghost", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], className)}
      {...rest}
    />
  );
});
