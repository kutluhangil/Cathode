"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { BOOT_KEY } from "@/lib/layout";
import { AppIcon } from "@/components/ui/AppIcon";
import { Icon, type IconName } from "@/components/icons";
import type { WallpaperId } from "@/lib/types";

interface Entry {
  id: string;
  label: string;
  hint?: string;
  icon: IconName | { appId: string };
  action: () => void;
}

/** Cmd/Ctrl+K — uygulama + sistem komutları tek palet. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openWin = useWindows((s) => s.open);
  const s = useSettings();
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQ("");
        setIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const apps: Entry[] = APPS.map((a) => ({
      id: `app-${a.id}`,
      label: t(a.name),
      hint: a.description ? t(a.description) : undefined,
      icon: { appId: a.id },
      action: () => openWin(a.id, a.name, a.defaultSize),
    }));
    const wallpapers: Entry[] = (
      ["phosphor", "blueprint", "testcard", "void", "photo"] as WallpaperId[]
    ).map((w) => ({
      id: `wp-${w}`,
      label: t("commandPalette.wallpaper", { name: w }),
      icon: "image" as IconName,
      action: () => s.setWallpaper(w),
    }));
    const system: Entry[] = [
      {
        id: "crt",
        label: s.crt ? t("commandPalette.crtOff") : t("commandPalette.crtOn"),
        icon: "crt",
        action: s.toggleCrt,
      },
      {
        id: "monitor",
        label: s.monitor
          ? t("commandPalette.monitorOff")
          : t("commandPalette.monitorOn"),
        icon: "monitor",
        action: s.toggleMonitor,
      },
      {
        id: "accent",
        label:
          s.accent === "amber"
            ? t("commandPalette.accentToGreen")
            : t("commandPalette.accentToAmber"),
        icon: "palette",
        action: s.toggleAccent,
      },
      {
        id: "reboot",
        label: t("commandPalette.reboot"),
        hint: t("commandPalette.rebootHint"),
        icon: "power",
        action: () => {
          sessionStorage.removeItem(BOOT_KEY);
          location.reload();
        },
      },
    ];
    return [...apps, ...system, ...wallpapers];
  }, [openWin, s, t]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(
      (e) =>
        e.label.toLowerCase().includes(term) ||
        e.hint?.toLowerCase().includes(term),
    );
  }, [q, entries]);

  const runEntry = (e: Entry) => {
    e.action();
    setOpen(false);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[index]) {
      runEntry(results[index]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[6000] flex items-start justify-center bg-black/40 pt-[18vh]"
          onPointerDown={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            onPointerDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={t("commandPalette.dialog")}
            className="w-[440px] max-w-[calc(100vw-32px)] overflow-hidden rounded-ui bg-surface-2 shadow-float"
          >
            <div className="flex items-center gap-2 border-b border-border-soft px-3 py-2.5">
              <span className="text-faint">
                <Icon name="search" size={14} />
              </span>
              <input
                ref={inputRef}
                data-testid="command-palette-input"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIndex(0);
                }}
                onKeyDown={onInputKey}
                placeholder={t("commandPalette.searchPlaceholder")}
                className="w-full bg-transparent font-mono text-sm text-text outline-none placeholder:text-faint"
              />
              <kbd className="rounded-btn border border-border-soft px-1.5 py-0.5 font-mono text-[9px] text-faint">
                esc
              </kbd>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {results.length === 0 && (
                <p className="px-3 py-5 text-center font-mono text-xs text-faint">
                  {t("common.noResults")}
                </p>
              )}
              {results.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => runEntry(e)}
                  onPointerEnter={() => setIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left transition-colors",
                    i === index ? "bg-surface-3" : "",
                  )}
                >
                  {typeof e.icon === "string" ? (
                    <span className="flex h-6 w-6 items-center justify-center text-faint">
                      <Icon name={e.icon} size={14} />
                    </span>
                  ) : (
                    <AppIcon app={{ id: e.icon.appId }} size={24} />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] text-text">
                      {e.label}
                    </span>
                    {e.hint && (
                      <span className="truncate text-[10px] text-faint">
                        {e.hint}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
