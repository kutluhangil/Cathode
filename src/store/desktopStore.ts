"use client";

import { create } from "zustand";

interface DesktopState {
  selectedIds: Set<string>;
  setSelection: (ids: Set<string> | string[]) => void;
  addSelection: (ids: string[]) => void;
  toggleSelection: (id: string, multi: boolean) => void;
  clearSelection: () => void;
}

export const useDesktop = create<DesktopState>((set) => ({
  selectedIds: new Set(),
  setSelection: (ids) => set({ selectedIds: new Set(ids) }),
  addSelection: (ids) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      ids.forEach((id) => next.add(id));
      return { selectedIds: next };
    }),
  toggleSelection: (id, multi) =>
    set((s) => {
      if (!multi) return { selectedIds: new Set([id]) };
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),
}));
