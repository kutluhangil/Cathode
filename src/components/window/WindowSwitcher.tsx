"use client";

import { useEffect, useState } from "react";
import { useWindows } from "@/store/windowsStore";
import { getApp } from "@/data/apps";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/components/ui/AppIcon";
import type { WindowInstance } from "@/lib/types";

/**
 * Alt+Tab pencere değiştirici.
 * Alt basılıyken Tab → aday ilerler (Shift+Tab geri), Alt bırakınca odaklanır.
 * Not: bazı işletim sistemleri Alt+Tab'ı tarayıcıya hiç iletmez (Windows
 * masaüstü); PWA/standalone ve macOS'ta çalışır. Esc iptal eder.
 */
export function WindowSwitcher() {
  const focus = useWindows((s) => s.focus);
  // açıkken sıralama sabit kalır (MRU: z'ye göre) — her Tab'da kaymasın
  const [order, setOrder] = useState<WindowInstance[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !e.altKey) return;
      const wins = [...useWindows.getState().windows].sort((a, b) => b.z - a.z);
      if (wins.length === 0) return;
      e.preventDefault();
      setOrder((cur) => {
        if (cur) {
          setIndex((i) => (i + (e.shiftKey ? -1 : 1) + cur.length) % cur.length);
          return cur;
        }
        // ilk Tab: en üstteki zaten odaklı — bir sonrakinden başla
        setIndex(wins.length > 1 ? 1 : 0);
        return wins;
      });
    };

    const commit = () => {
      setOrder((cur) => {
        if (cur) {
          setIndex((i) => {
            const target = cur[i];
            if (target) focus(target.id);
            return 0;
          });
        }
        return null;
      });
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") commit();
      if (e.key === "Escape") setOrder(null);
    };
    const onBlur = () => commit();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [focus]);

  if (!order) return null;

  return (
    <div
      role="dialog"
      aria-label="pencere değiştirici"
      className="pointer-events-none fixed inset-0 z-[6500] flex items-center justify-center"
    >
      <div className="flex items-center gap-2 rounded-ui bg-surface-2 p-3 shadow-float">
        {order.map((w, i) => {
          const app = getApp(w.appId);
          return (
            <div
              key={w.id}
              className={cn(
                "flex w-24 flex-col items-center gap-2 rounded-btn px-2 py-3 transition-colors",
                i === index ? "bg-surface-3 ring-1 ring-accent" : "opacity-60",
              )}
            >
              <AppIcon app={{ id: w.appId }} size={40} />
              <span
                className={cn(
                  "w-full truncate text-center font-mono text-[10px]",
                  i === index ? "text-text" : "text-text-dim",
                )}
              >
                {app?.name ?? w.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
