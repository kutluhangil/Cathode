"use client";

import { useCallback, useRef } from "react";
import { useWindows } from "@/store/windowsStore";
import type { Rect } from "@/lib/types";

const DOCK_RESERVE = 84;
const MIN_W = 280;
const MIN_H = 180;

export type ResizeDir =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

interface DragState {
  startX: number;
  startY: number;
  rect: Rect;
}

/** Title bar sürükleme — pencereyi taşır, ekran içinde tutar. */
export function useWindowMove(id: string, rect: Rect) {
  const setRect = useWindows((s) => s.setRect);
  const state = useRef<DragState | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      state.current = { startX: e.clientX, startY: e.clientY, rect };
    },
    [rect],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = state.current;
      if (!s) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // title bar her zaman görünür kalsın
      const x = Math.min(Math.max(dx + s.rect.x, -s.rect.w + 120), vw - 120);
      const y = Math.min(Math.max(dy + s.rect.y, 0), vh - DOCK_RESERVE - 8);
      setRect(id, { x, y });
    },
    [id, setRect],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    state.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

interface ResizeState {
  startX: number;
  startY: number;
  rect: Rect;
  dir: ResizeDir;
}

/** 8 yönden yeniden boyutlandırma. */
export function useWindowResize(id: string, rect: Rect) {
  const setRect = useWindows((s) => s.setRect);
  const state = useRef<ResizeState | null>(null);

  const start = useCallback(
    (dir: ResizeDir) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      state.current = { startX: e.clientX, startY: e.clientY, rect, dir };
    },
    [rect],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = state.current;
      if (!s) return;
      e.stopPropagation();
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      let { x, y, w, h } = s.rect;

      if (s.dir.includes("e")) w = Math.max(MIN_W, s.rect.w + dx);
      if (s.dir.includes("s")) h = Math.max(MIN_H, s.rect.h + dy);
      if (s.dir.includes("w")) {
        const nw = Math.max(MIN_W, s.rect.w - dx);
        x = s.rect.x + (s.rect.w - nw);
        w = nw;
      }
      if (s.dir.includes("n")) {
        const nh = Math.max(MIN_H, s.rect.h - dy);
        y = Math.max(0, s.rect.y + (s.rect.h - nh));
        h = nh;
      }
      setRect(id, { x, y, w, h });
    },
    [id, setRect],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    state.current = null;
  }, []);

  return { start, onPointerMove, onPointerUp };
}
