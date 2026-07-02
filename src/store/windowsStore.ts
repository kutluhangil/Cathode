"use client";

import { create } from "zustand";
import type { Rect, WindowInstance } from "@/lib/types";
import { DOCK_RESERVE, SYSTEM_BAR_H } from "@/lib/layout";

interface WindowsState {
  windows: WindowInstance[];
  focusedId: string | null;
  zCounter: number;
  open: (appId: string, title: string, size: { w: number; h: number }) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restore: (id: string) => void;
  setRect: (id: string, rect: Partial<Rect>) => void;
  /** dock davranışı: kapalıysa aç, odaktaysa minimize et, değilse öne getir */
  toggleFromDock: (
    appId: string,
    title: string,
    size: { w: number; h: number },
  ) => void;
}

let idSeq = 0;
const nextId = () => `win-${++idSeq}`;

function maximizedRect(): Rect {
  if (typeof window === "undefined") return { x: 0, y: 0, w: 1024, h: 768 };
  const top = SYSTEM_BAR_H + 6; // maximize sistem çubuğunu ve dock'u açıkta bırakır
  return {
    x: 0,
    y: top,
    w: window.innerWidth,
    h: window.innerHeight - top - DOCK_RESERVE,
  };
}

function spawnRect(size: { w: number; h: number }, index: number): Rect {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const w = Math.min(size.w, vw - 48);
  const h = Math.min(size.h, vh - DOCK_RESERVE - 48);
  const cascade = (index % 6) * 28;
  return {
    w,
    h,
    x: Math.max(24, Math.round((vw - w) / 2) + cascade - 70),
    y: Math.max(24, Math.round((vh - DOCK_RESERVE - h) / 2) + cascade - 40),
  };
}

export const useWindows = create<WindowsState>((set, get) => ({
  windows: [],
  focusedId: null,
  zCounter: 1,

  open: (appId, title, size) => {
    const id = nextId();
    set((s) => {
      const z = s.zCounter + 1;
      const win: WindowInstance = {
        id,
        appId,
        title,
        rect: spawnRect(size, s.windows.length),
        prevRect: null,
        z,
        status: "normal",
      };
      return { windows: [...s.windows, win], focusedId: id, zCounter: z };
    });
    return id;
  },

  close: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      const focusedId =
        s.focusedId === id
          ? windows.length
            ? windows.reduce((a, b) => (a.z > b.z ? a : b)).id
            : null
          : s.focusedId;
      return { windows, focusedId };
    }),

  focus: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focusedId: id,
        windows: s.windows.map((w) =>
          w.id === id
            ? { ...w, z, status: w.status === "minimized" ? "normal" : w.status }
            : w,
        ),
      };
    }),

  minimize: (id) =>
    set((s) => {
      const rest = s.windows.filter(
        (w) => w.id !== id && w.status !== "minimized",
      );
      const focusedId = rest.length
        ? rest.reduce((a, b) => (a.z > b.z ? a : b)).id
        : null;
      return {
        focusedId,
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, status: "minimized" } : w,
        ),
      };
    }),

  toggleMaximize: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focusedId: id,
        windows: s.windows.map((w) => {
          if (w.id !== id) return w;
          if (w.status === "maximized") {
            return {
              ...w,
              status: "normal",
              rect: w.prevRect ?? w.rect,
              prevRect: null,
              z,
            };
          }
          return {
            ...w,
            status: "maximized",
            prevRect: w.rect,
            rect: maximizedRect(),
            z,
          };
        }),
      };
    }),

  restore: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        focusedId: id,
        windows: s.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                status: "normal",
                rect: w.prevRect ?? w.rect,
                prevRect: null,
                z,
              }
            : w,
        ),
      };
    }),

  setRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, rect: { ...w.rect, ...rect } } : w,
      ),
    })),

  toggleFromDock: (appId, title, size) => {
    const { windows, focusedId, open, focus, minimize } = get();
    const existing = windows.find((w) => w.appId === appId);
    if (!existing) {
      open(appId, title, size);
      return;
    }
    if (existing.status === "minimized") {
      focus(existing.id);
    } else if (focusedId === existing.id) {
      minimize(existing.id);
    } else {
      focus(existing.id);
    }
  },
}));
