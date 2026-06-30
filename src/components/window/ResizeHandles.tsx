"use client";

import type { ResizeDir } from "./useWindowDrag";

interface Props {
  start: (dir: ResizeDir) => (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

// kenar + köşe tutamakları; ince, görünmez, doğru imleçli
const handles: { dir: ResizeDir; cls: string }[] = [
  { dir: "n", cls: "top-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { dir: "s", cls: "bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { dir: "e", cls: "right-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { dir: "w", cls: "left-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { dir: "ne", cls: "top-0 right-0 h-3 w-3 cursor-nesw-resize" },
  { dir: "nw", cls: "top-0 left-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "se", cls: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "sw", cls: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
];

export function ResizeHandles({ start, onPointerMove, onPointerUp }: Props) {
  return (
    <>
      {handles.map((h) => (
        <div
          key={h.dir}
          className={`absolute z-20 ${h.cls}`}
          onPointerDown={start(h.dir)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      ))}
    </>
  );
}
