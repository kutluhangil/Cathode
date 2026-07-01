"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentName, WallpaperId } from "@/lib/types";

interface SettingsState {
  accent: AccentName;
  crt: boolean;
  motion: boolean; // animasyonlar açık mı (prefers-reduced-motion ile birlikte değerlendirilir)
  sound: boolean;
  wallpaper: WallpaperId;
  /** boot bu oturumda gösterildi mi (kalıcı değil — bkz. sessionStorage mantığı page'de) */
  setAccent: (a: AccentName) => void;
  toggleAccent: () => void;
  setCrt: (v: boolean) => void;
  toggleCrt: () => void;
  setMotion: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setWallpaper: (w: WallpaperId) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      accent: "amber",
      crt: true, // spec §4: CRT varsayılan hafif açık
      motion: true,
      sound: false,
      wallpaper: "horizon",
      setAccent: (accent) => set({ accent }),
      toggleAccent: () =>
        set((s) => ({ accent: s.accent === "amber" ? "green" : "amber" })),
      setCrt: (crt) => set({ crt }),
      toggleCrt: () => set((s) => ({ crt: !s.crt })),
      setMotion: (motion) => set({ motion }),
      setSound: (sound) => set({ sound }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
    }),
    { name: "cathode.settings" },
  ),
);
