"use client";

import { create } from "zustand";

interface UiState {
  /** Ayarlar'daki "şimdi önizle" tıklandıkça artan sayaç — Screensaver bunu izler. */
  screensaverPreviewToken: number;
  previewScreensaver: () => void;
}

/** Kalıcı olmayan, oturum içi UI durumu (persist YOK — settingsStore'dan ayrı). */
export const useUiStore = create<UiState>((set) => ({
  screensaverPreviewToken: 0,
  previewScreensaver: () =>
    set((s) => ({ screensaverPreviewToken: s.screensaverPreviewToken + 1 })),
}));
