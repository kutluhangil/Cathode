"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/components/ui/AppIcon";
import type { AppDefinition } from "@/lib/types";

interface Props {
  app: AppDefinition;
  onOpen: () => void;
}

export function DesktopIcon({ app, onOpen }: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      onClick={onOpen}
      onFocus={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      aria-label={app.name}
      className={cn(
        "group flex w-20 flex-col items-center gap-1.5 rounded-[10px] p-2 text-center outline-none transition-colors",
        selected ? "bg-accent/15" : "hover:bg-white/5",
      )}
    >
      <span
        className={cn(
          "rounded-[14px] p-0.5 transition-all duration-200",
          selected
            ? "ring-2 ring-accent/70"
            : "group-hover:-translate-y-0.5 group-hover:scale-105",
        )}
        aria-hidden
      >
        <AppIcon app={app} size={48} />
      </span>
      <span className="line-clamp-2 text-[11px] leading-tight text-text/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {app.name}
      </span>
    </button>
  );
}
