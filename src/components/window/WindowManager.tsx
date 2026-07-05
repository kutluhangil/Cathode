"use client";

import { AnimatePresence } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useIsMobile } from "@/lib/useIsMobile";
import { Window } from "./Window";

export function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const visible = windows.filter((w) => w.status !== "minimized");

  if (isMobile) {
    // single fullscreen window: the focused one, else the top-z visible one
    const top =
      visible.find((w) => w.id === focusedId) ??
      (visible.length ? visible.reduce((a, b) => (a.z > b.z ? a : b)) : null);
    return (
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {top && <Window key={top.id} win={top} active reduced={reduced} mobile />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* her pencere kendi pointer-events'ini geri açar */}
      <AnimatePresence>
        {visible.map((w) => (
          <Window
            key={w.id}
            win={w}
            active={w.id === focusedId}
            reduced={reduced}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
