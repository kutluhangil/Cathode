"use client";

import { AnimatePresence } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { usePrefersReducedMotion } from "@/lib/motion";
import { Window } from "./Window";

export function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* her pencere kendi pointer-events'ini geri açar */}
      <AnimatePresence>
        {windows
          .filter((w) => w.status !== "minimized")
          .map((w) => (
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
