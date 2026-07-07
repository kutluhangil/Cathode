"use client";

import { useEffect, useState } from "react";
import { useWindows } from "@/store/windowsStore";
import { getApp } from "@/data/apps";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";

/**
 * Aynı anda 2+ emülatör penceresi açıkken performans uyarısı gösterir.
 * Emülatör pencereleri capturesKeyboard bayrağıyla tanınır.
 */
export function EmuPerfWarning() {
  const windows = useWindows((s) => s.windows);
  const t = useT();
  const [dismissed, setDismissed] = useState(false);

  const count = windows.filter(
    (w) => w.status !== "minimized" && getApp(w.appId)?.capturesKeyboard,
  ).length;

  // 2'nin altına düşünce kapatma durumunu sıfırla (tekrar açılırsa yine görünsün)
  useEffect(() => {
    if (count < 2 && dismissed) setDismissed(false);
  }, [count, dismissed]);

  if (count < 2 || dismissed) return null;

  return (
    <div
      data-testid="emu-perf-warning"
      className="pointer-events-auto absolute left-1/2 top-10 z-[3000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-warn/50 bg-void/85 px-3 py-1.5 backdrop-blur"
    >
      <span className="text-warn">
        <Icon name="disk" size={13} />
      </span>
      <span className="font-mono text-[11px] text-text-dim">
        {t("emulator.perfWarning")}
      </span>
      <button
        aria-label={t("common.close")}
        onClick={() => setDismissed(true)}
        className="text-text-dim hover:text-text"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}
