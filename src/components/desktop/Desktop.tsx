"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useFiles } from "@/store/filesStore";
import { useKonami } from "@/lib/useKonami";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n/useT";
import { stagger, riseItem } from "@/lib/motion";
import type { WallpaperId } from "@/lib/types";
import { Wallpaper } from "./Wallpaper";
import { DesktopIcon } from "./DesktopIcon";
import { DesktopFiles } from "./DesktopFiles";
import { EmuPerfWarning } from "./EmuPerfWarning";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { CommandPalette } from "./CommandPalette";
import { Screensaver } from "./Screensaver";
import { WindowManager } from "@/components/window/WindowManager";
import { WindowSwitcher } from "@/components/window/WindowSwitcher";
import { Dock } from "@/components/dock/Dock";
import { SystemBar } from "@/components/dock/SystemBar";

const WP_ORDER: WallpaperId[] = [
  "phosphor",
  "blueprint",
  "testcard",
  "void",
  "photo",
];

/** Masaüstünde çakışmayan benzersiz dosya adı (prompt olmadan hızlı oluşturma). */
function uniqueName(base: string): string {
  return `${base}-${Math.floor(performance.now() % 100000)}`;
}

export function Desktop() {
  const launch = useWindows((s) => s.launch);
  const wallpaper = useSettings((s) => s.wallpaper);
  const setWallpaper = useSettings((s) => s.setWallpaper);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [spin, setSpin] = useState(0); // "yenile" görsel geri bildirimi
  const t = useT();

  const hydrateFiles = useFiles((s) => s.hydrate);
  const createDir = useFiles((s) => s.createDir);
  const createFile = useFiles((s) => s.createFile);
  useEffect(() => {
    void hydrateFiles();
  }, [hydrateFiles]);

  // easter egg: Konami kodu → kısa "fosfor aşırı yükleme" parıltısı
  const [konami, setKonami] = useState(false);
  const onKonami = useCallback(() => {
    setKonami(true);
    window.setTimeout(() => setKonami(false), 2500);
  }, []);
  useKonami(onKonami);

  const cycleWallpaper = () => {
    const i = WP_ORDER.indexOf(wallpaper);
    setWallpaper(WP_ORDER[(i + 1) % WP_ORDER.length]);
  };

  const openApp = (id: string) => {
    const app = APPS.find((a) => a.id === id);
    if (app) launch(app.id, app.name, app.defaultSize, undefined, app.singleton);
  };

  const menuItems: MenuItem[] = [
    {
      label: t("files.newFolder"),
      icon: "folder-plus",
      onClick: () => void createDir("/Desktop", uniqueName("folder")),
    },
    {
      label: t("files.newFile"),
      icon: "file",
      onClick: () => void createFile("/Desktop", uniqueName("note") + ".txt"),
      divider: true,
    },
    { label: t("menu.refresh"), icon: "refresh", onClick: () => setSpin((s) => s + 1) },
    { label: t("menu.changeWallpaper"), icon: "image", onClick: cycleWallpaper },
    {
      label: t("menu.settings"),
      icon: "settings",
      onClick: () => openApp("settings"),
      divider: true,
    },
    { label: t("menu.about"), icon: "info", onClick: () => openApp("about") },
  ];

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-desk"
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <Wallpaper key={`${wallpaper}-${spin}`} />

      {/* ikon ızgarası — sistem çubuğunun altından başlar */}
      <motion.div
        key={spin}
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="absolute left-4 top-10 z-10 grid grid-flow-col grid-rows-[repeat(5,auto)] gap-1"
      >
        {APPS.map((a) => (
          <motion.div key={a.id} variants={riseItem}>
            <DesktopIcon app={a} onOpen={() => openApp(a.id)} />
          </motion.div>
        ))}
      </motion.div>

      {/* /Desktop klasörü — serbest konumlu kullanıcı ikonları */}
      <DesktopFiles />

      {/* görünür disclaimer (spec §5) — tıkla → Hakkında */}
      <button
        onClick={() => openApp("about")}
        className="desk-disclaimer absolute bottom-5 left-4 z-[1000] max-w-[240px] text-left font-mono text-[10px] leading-tight text-text-dim/70 transition-colors hover:text-text-dim"
      >
        {t("menu.disclaimer")}
      </button>

      <WindowManager />
      <EmuPerfWarning />
      <WindowSwitcher />
      <CommandPalette />
      <SystemBar />
      <Dock />
      <Screensaver />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}

      {/* easter egg overlay — Konami kodu */}
      {konami && (
        <div
          data-testid="konami"
          className="pointer-events-none absolute inset-0 z-[7000] flex items-center justify-center"
        >
          <div
            className="absolute inset-0 animate-pulse"
            style={{ background: "var(--accent)", opacity: 0.12 }}
          />
          <span className="phosphor animate-pulse text-2xl font-semibold tracking-widest text-accent [text-shadow:0_0_20px_var(--accent-glow)]">
            {t("easter.konami")}
          </span>
        </div>
      )}
    </div>
  );
}
