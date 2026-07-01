"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useSettings } from "@/store/settingsStore";
import { stagger, riseItem } from "@/lib/motion";
import type { WallpaperId } from "@/lib/types";
import { Wallpaper } from "./Wallpaper";
import { DesktopIcon } from "./DesktopIcon";
import { ContextMenu, type MenuItem } from "./ContextMenu";
import { WindowManager } from "@/components/window/WindowManager";
import { Dock } from "@/components/dock/Dock";

const WP_ORDER: WallpaperId[] = ["horizon", "aurora", "grid", "monolith"];

export function Desktop() {
  const open = useWindows((s) => s.open);
  const wallpaper = useSettings((s) => s.wallpaper);
  const setWallpaper = useSettings((s) => s.setWallpaper);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [spin, setSpin] = useState(0); // "yenile" görsel geri bildirimi

  const cycleWallpaper = () => {
    const i = WP_ORDER.indexOf(wallpaper);
    setWallpaper(WP_ORDER[(i + 1) % WP_ORDER.length]);
  };

  const openApp = (id: string) => {
    const app = APPS.find((a) => a.id === id);
    if (app) open(app.id, app.name, app.defaultSize);
  };

  const menuItems: MenuItem[] = [
    { label: "Yenile", onClick: () => setSpin((s) => s + 1) },
    { label: "Duvar kâğıdını değiştir", onClick: cycleWallpaper },
    { label: "Ayarlar", onClick: () => openApp("settings"), divider: true },
    { label: "Hakkında", onClick: () => openApp("about") },
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

      {/* ikon ızgarası */}
      <motion.div
        key={spin}
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="absolute left-4 top-4 grid grid-flow-col grid-rows-[repeat(5,auto)] gap-1"
      >
        {APPS.map((a) => (
          <motion.div key={a.id} variants={riseItem}>
            <DesktopIcon app={a} onOpen={() => openApp(a.id)} />
          </motion.div>
        ))}
      </motion.div>

      {/* görünür disclaimer (spec §5) — tıkla → Hakkında */}
      <button
        onClick={() => openApp("about")}
        className="absolute bottom-5 left-4 z-[1000] max-w-[240px] text-left font-mono text-[10px] leading-tight text-text-dim/70 transition-colors hover:text-text-dim"
      >
        hobi / arşiv / eğitim projesi · emülasyon açık kaynak · reklam yok ·
        detay için tıkla
      </button>

      <WindowManager />
      <Dock />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
