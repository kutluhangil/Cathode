"use client";

import { useEffect } from "react";
import { useSettings } from "@/store/settingsStore";

/**
 * settingsStore'u <html> data-attribute'larına bağlar.
 * globals.css bu attribute'lara göre accent ve CRT efektlerini uygular.
 * Hydration uyumu için mount sonrası uygulanır.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const accent = useSettings((s) => s.accent);
  const crt = useSettings((s) => s.crt);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = accent;
    root.dataset.crt = crt ? "on" : "off";
  }, [accent, crt]);

  return <>{children}</>;
}
