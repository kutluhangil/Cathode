"use client";

import { useEffect, useRef } from "react";
import { useFiles } from "@/store/filesStore";
import { useWindows } from "@/store/windowsStore";
import { SYSTEM_BAR_H } from "@/lib/layout";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

/** /Desktop klasörü — serbest konumlu, sürüklenebilir masaüstü ikonları. */
export function DesktopFiles() {
  const entries = useFiles((s) => s.entriesByDir["/Desktop"]) ?? [];
  const positions = useFiles((s) => s.positions);
  const setPosition = useFiles((s) => s.setPosition);
  const refresh = useFiles((s) => s.refresh);
  const open = useWindows((s) => s.open);

  useEffect(() => {
    void refresh("/Desktop");
  }, [refresh]);

  const defaultPos = (i: number) => ({
    x: 24,
    y: SYSTEM_BAR_H + 24 + i * 92,
  });

  const onOpen = (e: FsEntry) => {
    if (e.kind === "dir")
      open("filemanager", "apps.files", { w: 620, h: 480 }, { path: e.path });
    else if (e.name.endsWith(".txt"))
      open("notepad", "apps.notepad", { w: 460, h: 420 }, { path: e.path });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {entries.map((e, i) => {
        const pos = positions[e.path] ?? defaultPos(i);
        return (
          <DesktopFileIcon
            key={e.path}
            entry={e}
            x={pos.x}
            y={pos.y}
            onMove={(x, y) => setPosition(e.path, x, y)}
            onOpen={() => onOpen(e)}
          />
        );
      })}
    </div>
  );
}

function DesktopFileIcon({
  entry,
  x,
  y,
  onMove,
  onOpen,
}: {
  entry: FsEntry;
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
  onOpen: () => void;
}) {
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  return (
    <button
      data-testid={`desk-file-${entry.name}`}
      onDoubleClick={onOpen}
      onPointerDown={(e) => {
        drag.current = { dx: e.clientX - x, dy: e.clientY - y, moved: false };
        try {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch {
          /* best-effort capture */
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const nx = e.clientX - d.dx;
        const ny = e.clientY - d.dy;
        if (Math.abs(nx - x) + Math.abs(ny - y) > 2) d.moved = true;
        onMove(Math.max(0, nx), Math.max(SYSTEM_BAR_H, ny));
      }}
      onPointerUp={(e) => {
        try {
          (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch {
          /* nothing captured */
        }
        drag.current = null;
      }}
      style={{ left: x, top: y }}
      className="pointer-events-auto absolute flex w-20 flex-col items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors hover:bg-white/5"
    >
      <span className="text-accent">
        <Icon name={entry.kind === "dir" ? "folder" : "file"} size={44} />
      </span>
      <span className="line-clamp-2 break-all text-[11px] leading-tight text-text/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {entry.name}
      </span>
    </button>
  );
}
