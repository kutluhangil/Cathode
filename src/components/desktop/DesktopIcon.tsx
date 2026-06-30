"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AppDefinition } from "@/lib/types";

interface Props {
  app: AppDefinition;
  onOpen: () => void;
}

export function DesktopIcon({ app, onOpen }: Props) {
  const [selected, setSelected] = useState(false);

  return (
    <button
      onClick={() => setSelected(true)}
      onDoubleClick={onOpen}
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
          "flex h-11 w-11 items-center justify-center rounded-[12px] border text-xl",
          "bg-surface/70 backdrop-blur transition-all duration-200",
          selected
            ? "border-accent text-accent shadow-glow"
            : "border-border text-text group-hover:border-accent/60",
        )}
        aria-hidden
      >
        {app.glyph}
      </span>
      <span className="line-clamp-2 text-[11px] leading-tight text-text/90 drop-shadow">
        {app.name}
      </span>
    </button>
  );
}
