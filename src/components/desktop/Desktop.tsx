"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useFiles } from "@/store/filesStore";
import { useSettings } from "@/store/settingsStore";
import { useDesktop } from "@/store/desktopStore";
import { useKonami } from "@/lib/useKonami";
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
  const desktopIconSize = useSettings((s) => s.desktopIconSize);
  const setDesktopIconSize = useSettings((s) => s.setDesktopIconSize);
  
  const setSelection = useDesktop((s) => s.setSelection);
  const clearSelection = useDesktop((s) => s.clearSelection);

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [spin, setSpin] = useState(0); // "yenile" görsel geri bildirimi
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number; initialSelection: string[] } | null>(null);
  const t = useT();

  const hydrateFiles = useFiles((s) => s.hydrate);
  const createDir = useFiles((s) => s.createDir);
  const createFile = useFiles((s) => s.createFile);
  useEffect(() => {
    void hydrateFiles();
  }, [hydrateFiles]);

  // shift+wheel zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        setDesktopIconSize(
          Math.min(128, Math.max(32, desktopIconSize - e.deltaY * 0.5))
        );
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [desktopIconSize, setDesktopIconSize]);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".window-frame") || (e.target as HTMLElement).closest("[data-desktop-icon]") || (e.target as HTMLElement).closest(".desktop-dock")) {
      return;
    }
    const currentSelection = useDesktop.getState().selectedIds;
    let initialSelection: string[] = [];
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      initialSelection = Array.from(currentSelection);
    } else {
      clearSelection();
    }
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      initialSelection,
    });
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!selectionBox) return;
    setSelectionBox((prev) => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

    const minX = Math.min(selectionBox.startX, e.clientX);
    const maxX = Math.max(selectionBox.startX, e.clientX);
    const minY = Math.min(selectionBox.startY, e.clientY);
    const maxY = Math.max(selectionBox.startY, e.clientY);

    const icons = document.querySelectorAll("[data-desktop-icon]");
    const newSelected = new Set<string>();
    icons.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (!(rect.right < minX || rect.left > maxX || rect.bottom < minY || rect.top > maxY)) {
        const id = el.getAttribute("data-id");
        if (id) newSelected.add(id);
      }
    });

    const finalSet = new Set(selectionBox.initialSelection);
    newSelected.forEach(id => finalSet.add(id));
    setSelection(Array.from(finalSet));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (selectionBox) {
      setSelectionBox(null);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
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
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
      onClick={(e) => {
        // Only clear if it was a quick click without much movement.
        // We handle selection clearing in onPointerDown. If we didn't drag,
        // onPointerDown already cleared it. If we did drag, we don't want
        // this onClick to clear what we just selected.
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

      {selectionBox && (
        <div
          className="pointer-events-none absolute z-[50] border border-accent/60 bg-accent/20"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
        />
      )}

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
