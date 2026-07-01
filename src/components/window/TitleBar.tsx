"use client";

import { useWindows } from "@/store/windowsStore";
import { cn } from "@/lib/cn";
import { useWindowMove } from "./useWindowDrag";
import type { WindowInstance } from "@/lib/types";

interface Props {
  win: WindowInstance;
  glyph: string;
  active: boolean;
}

export function TitleBar({ win, glyph, active }: Props) {
  const move = useWindowMove(win.id, win.rect);
  const minimize = useWindows((s) => s.minimize);
  const toggleMaximize = useWindows((s) => s.toggleMaximize);
  const close = useWindows((s) => s.close);

  return (
    <div
      onPointerDown={move.onPointerDown}
      onPointerMove={move.onPointerMove}
      onPointerUp={move.onPointerUp}
      onDoubleClick={() => toggleMaximize(win.id)}
      className={cn(
        "flex h-9 shrink-0 select-none items-center gap-2 px-3",
        "cursor-grab active:cursor-grabbing",
        "border-b border-border-soft",
      )}
    >
      <span
        className={cn(
          "font-mono text-[13px] leading-none",
          active ? "text-accent phosphor" : "text-text-dim",
        )}
        aria-hidden
      >
        {glyph}
      </span>
      <span
        className={cn(
          "flex-1 truncate text-[13px]",
          active ? "text-text" : "text-text-dim",
        )}
      >
        {win.title}
      </span>

      <div className="flex items-center gap-1">
        <WinBtn label="küçült" onClick={() => minimize(win.id)}>
          −
        </WinBtn>
        <WinBtn label="büyüt" onClick={() => toggleMaximize(win.id)}>
          ▢
        </WinBtn>
        <WinBtn
          label="kapat"
          onClick={() => close(win.id)}
          className="hover:bg-[#ff5f56] hover:text-white"
        >
          ✕
        </WinBtn>
      </div>
    </div>
  );
}

function WinBtn({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px] leading-none text-text-dim transition-colors duration-150 hover:bg-white/10 hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}
