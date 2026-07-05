"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/components/ui/AppIcon";
import { CathodeMark } from "@/components/icons";
import { StartMenu } from "./StartMenu";

/**
 * Alt dock — yalnız uygulama başlatıcı/değiştirici.
 * Tray (accent/CRT/monitör/saat) SystemBar'a taşındı.
 */
export function Dock() {
  const [menuOpen, setMenuOpen] = useState(false);
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const toggleFromDock = useWindows((s) => s.toggleFromDock);

  const runningIds = new Set(windows.map((w) => w.appId));
  // dock listesi: sabit uygulamalar + sabit olmayan ama açık uygulamalar
  const dockApps = [
    ...APPS.filter((a) => a.pinned),
    ...APPS.filter((a) => !a.pinned && runningIds.has(a.id)),
  ];

  const activeAppId = windows.find((w) => w.id === focusedId)?.appId;
  const t = useT();

  return (
    <div className="dock-wrap pointer-events-none absolute bottom-4 left-0 right-0 z-[2000] flex items-end justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-ui border border-border-soft bg-glass px-2 py-2 shadow-win">
        {/* Cathode launcher — menü butonun üstüne çıpalanır */}
        <div className="relative">
          <AnimatePresence>
            {menuOpen && <StartMenu onClose={() => setMenuOpen(false)} />}
          </AnimatePresence>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("dock.menu")}
            aria-expanded={menuOpen}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-btn transition-all duration-150",
              menuOpen
                ? "bg-accent text-accent-ink shadow-glow"
                : "text-accent hover:bg-surface-3",
            )}
          >
            <span className="phosphor">
              <CathodeMark size={22} />
            </span>
          </button>
        </div>

        <div className="mx-1 h-8 w-px bg-border-soft" />

        {/* app ikonları */}
        {dockApps.map((a) => {
          const running = runningIds.has(a.id);
          const active = a.id === activeAppId;
          return (
            <button
              key={a.id}
              onClick={() => toggleFromDock(a.id, a.name, a.defaultSize)}
              aria-label={t(a.name)}
              title={t(a.name)}
              className="group relative flex h-11 w-11 items-center justify-center"
            >
              <span
                className={cn(
                  "transition-all duration-150 group-hover:-translate-y-1.5 group-hover:scale-110",
                  active && "drop-shadow-[0_0_10px_var(--accent-glow)]",
                )}
              >
                <AppIcon app={a} size={44} />
              </span>
              {/* çalışıyor göstergesi */}
              <span
                className={cn(
                  "absolute -bottom-1 h-1 w-1 rounded-full transition-opacity",
                  running ? "bg-accent opacity-100" : "opacity-0",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
