"use client";

import { useEffect, useRef } from "react";
import { useFiles } from "@/store/filesStore";
import { useWindows } from "@/store/windowsStore";
import { SYSTEM_BAR_H } from "@/lib/layout";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";
import { useSettings } from "@/store/settingsStore";
import { useDesktop } from "@/store/desktopStore";

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

  const desktopIconSize = useSettings((s) => s.desktopIconSize);
  const selectedIds = useDesktop((s) => s.selectedIds);
  const toggleSelection = useDesktop((s) => s.toggleSelection);

  const defaultPos = (i: number) => ({
    x: 24,
    y: SYSTEM_BAR_H + 24 + i * (desktopIconSize + 44),
  });

  const onOpen = (e: FsEntry) => {
    if (e.kind === "dir")
      open("filemanager", "apps.files", { w: 620, h: 480 }, { path: e.path });
    else openFile(open, e);
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
            iconSize={desktopIconSize}
            selected={selectedIds.has(e.path)}
            onSelect={(multi) => toggleSelection(e.path, multi)}
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
  iconSize,
  selected,
  onSelect,
  onMove,
  onOpen,
}: {
  entry: FsEntry;
  x: number;
  y: number;
  iconSize: number;
  selected: boolean;
  onSelect: (multi: boolean) => void;
  onMove: (x: number, y: number) => void;
  onOpen: () => void;
}) {
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  return (
    <button
      data-testid={`desk-file-${entry.name}`}
      data-desktop-icon="true"
      data-id={entry.path}
      onDoubleClick={onOpen}
      onClick={(e) => onSelect(e.shiftKey || e.metaKey || e.ctrlKey)}
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
      style={{ left: x, top: y, width: iconSize + 32 }}
      className={`pointer-events-auto absolute flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors ${
        selected ? "bg-accent/15 ring-2 ring-accent/70" : "hover:bg-white/5"
      }`}
    >
      <span className={`text-accent transition-transform ${!selected && "hover:-translate-y-0.5 hover:scale-105"}`}>
        <Icon name={entry.kind === "dir" ? "folder" : "file"} size={iconSize - 4} />
      </span>
      <span className="line-clamp-2 break-all text-[11px] leading-tight text-text/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {entry.name}
      </span>
    </button>
  );
}
