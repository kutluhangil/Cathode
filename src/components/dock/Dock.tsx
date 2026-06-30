"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useSettings } from "@/store/settingsStore";
import { cn } from "@/lib/cn";
import { Clock } from "./Clock";
import { StartMenu } from "./StartMenu";

export function Dock() {
  const [menuOpen, setMenuOpen] = useState(false);
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const toggleFromDock = useWindows((s) => s.toggleFromDock);

  const toggleAccent = useSettings((s) => s.toggleAccent);
  const toggleCrt = useSettings((s) => s.toggleCrt);
  const crt = useSettings((s) => s.crt);

  const runningIds = new Set(windows.map((w) => w.appId));
  // dock listesi: sabit uygulamalar + sabit olmayan ama açık uygulamalar
  const dockApps = [
    ...APPS.filter((a) => a.pinned),
    ...APPS.filter((a) => !a.pinned && runningIds.has(a.id)),
  ];

  const activeAppId = windows.find((w) => w.id === focusedId)?.appId;

  return (
    <>
      <AnimatePresence>
        {menuOpen && <StartMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-[2000] flex items-end justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-[16px] border border-border bg-glass px-2 py-2 shadow-win">
          {/* Cathode launcher */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Cathode menüsü"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-[12px] text-lg transition-all duration-150",
              menuOpen
                ? "bg-accent text-accent-ink shadow-glow"
                : "text-accent hover:bg-white/5",
            )}
          >
            <span className="phosphor">◉</span>
          </button>

          <div className="mx-1 h-8 w-px bg-border-soft" />

          {/* app ikonları */}
          {dockApps.map((a) => {
            const running = runningIds.has(a.id);
            const active = a.id === activeAppId;
            return (
              <button
                key={a.id}
                onClick={() => toggleFromDock(a.id, a.name, a.defaultSize)}
                aria-label={a.name}
                title={a.name}
                className="group relative flex h-11 w-11 items-center justify-center"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-[12px] border text-lg transition-all duration-150",
                    "group-hover:-translate-y-1 group-hover:scale-110",
                    active
                      ? "border-accent bg-accent/15 text-accent shadow-glow"
                      : "border-transparent text-text hover:border-border hover:bg-white/5",
                  )}
                >
                  {a.glyph}
                </span>
                {/* çalışıyor göstergesi */}
                <span
                  className={cn(
                    "absolute -bottom-0.5 h-1 w-1 rounded-full transition-opacity",
                    running ? "bg-accent opacity-100" : "opacity-0",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* tray — saat + hızlı toggle'lar */}
        <div className="pointer-events-auto absolute right-4 hidden items-center gap-3 rounded-[14px] border border-border bg-glass px-4 py-2 shadow-win sm:flex">
          <button
            onClick={toggleAccent}
            aria-label="accent rengini değiştir"
            title="accent"
            className="h-3.5 w-3.5 rounded-full border border-border/60"
            style={{ background: "var(--accent)" }}
          />
          <button
            onClick={toggleCrt}
            aria-label="CRT efektlerini aç/kapa"
            title="CRT"
            className={cn(
              "font-mono text-[11px] transition-colors",
              crt ? "text-accent" : "text-text-dim hover:text-text",
            )}
          >
            CRT
          </button>
          <div className="h-6 w-px bg-border-soft" />
          <Clock />
        </div>
      </div>
    </>
  );
}
