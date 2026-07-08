"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentName, WallpaperId } from "@/lib/types";
import type { Lang } from "@/lib/i18n/types";

interface SettingsState {
  /** arayüz dili — TR/EN canlı geçiş */
  lang: Lang;
  accent: AccentName;
  crt: boolean;
  /** fiziksel "Retrograde 5100" monitör çerçevesi (bezel + LED) */
  monitor: boolean;
  motion: boolean; // animasyonlar açık mı (prefers-reduced-motion ile birlikte değerlendirilir)
  sound: boolean;
  /** 3 dk hareketsizlikte fosfor ekran koruyucu */
  screensaver: boolean;
  wallpaper: WallpaperId;
  /** "photo" duvar kâğıdı için rastgele tohum — her yenilemede yeni 4K görsel */
  photoSeed: number;
  desktopIconSize: number;
  setAccent: (a: AccentName) => void;
  toggleAccent: () => void;
  setCrt: (v: boolean) => void;
  toggleCrt: () => void;
  setMonitor: (v: boolean) => void;
  toggleMonitor: () => void;
  setMotion: (v: boolean) => void;
  setSound: (v: boolean) => void;
  setScreensaver: (v: boolean) => void;
  setWallpaper: (w: WallpaperId) => void;
  /** yeni rastgele fotoğraf çek (photo duvar kâğıdı) */
  shufflePhoto: () => void;
  setLang: (l: Lang) => void;
  setDesktopIconSize: (size: number) => void;
}

const VALID_WALLPAPERS: WallpaperId[] = [
  "phosphor",
  "blueprint",
  "testcard",
  "void",
  "photo",
  "alpenglow",
  "dolomites",
  "stormline",
];

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: "tr",
      accent: "amber",
      crt: true, // spec §4: CRT varsayılan hafif açık
      monitor: false, // spec v2 §9: monitör modu varsayılan kapalı
      motion: true,
      sound: false,
      screensaver: true,
      wallpaper: "phosphor",
      photoSeed: 1,
      desktopIconSize: 48,
      setAccent: (accent) => set({ accent }),
      toggleAccent: () =>
        set((s) => {
          const order: AccentName[] = ["amber", "green", "blue", "white"];
          const i = order.indexOf(s.accent);
          return { accent: order[(i + 1) % order.length] };
        }),
      setCrt: (crt) => set({ crt }),
      toggleCrt: () => set((s) => ({ crt: !s.crt })),
      setMonitor: (monitor) => set({ monitor }),
      toggleMonitor: () => set((s) => ({ monitor: !s.monitor })),
      setMotion: (motion) => set({ motion }),
      setSound: (sound) => set({ sound }),
      setScreensaver: (screensaver) => set({ screensaver }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      shufflePhoto: () =>
        set((s) => ({ wallpaper: "photo", photoSeed: s.photoSeed + 1 })),
      setLang: (lang) => set({ lang }),
      setDesktopIconSize: (size) => set({ desktopIconSize: size }),
    }),
    {
      name: "retrograde.settings",
      version: 3,
      // v1 → v2: eski duvar kâğıdı adları (horizon/aurora/grid/monolith) kalktı
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (
          !s.wallpaper ||
          !VALID_WALLPAPERS.includes(s.wallpaper as WallpaperId)
        ) {
          s.wallpaper = "phosphor";
        }
        if (typeof s.monitor !== "boolean") s.monitor = false;
        // v2 → v3: dil alanı eklendi
        if (s.lang !== "tr" && s.lang !== "en") s.lang = "tr";
        if (typeof s.desktopIconSize !== "number") s.desktopIconSize = 48;
        return s as SettingsState;
      },
    },
  ),
);
