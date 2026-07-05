"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { AppIcon } from "@/components/ui/AppIcon";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface Props {
  onClose: () => void;
}

/** Cathode menüsü — uygulama listesi + arama ("Start" yazmaz). */
export function StartMenu({ onClose }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const open = useWindows((s) => s.open);
  const t = useT();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return APPS;
    return APPS.filter(
      (a) =>
        t(a.name).toLowerCase().includes(term) ||
        (a.description && t(a.description).toLowerCase().includes(term)),
    );
  }, [q, t]);

  const launch = (id: string, name: string, size: { w: number; h: number }) => {
    open(id, name, size);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(e) => e.stopPropagation()}
      role="menu"
      className="absolute bottom-full left-0 z-[3000] mb-3 w-80 origin-bottom-left overflow-hidden rounded-ui bg-surface-2 shadow-float"
    >
      <div className="border-b border-border-soft p-3">
        <div className="flex items-center gap-2 rounded-btn border border-border-soft bg-surface-0 px-3 py-2 focus-within:border-accent">
          <span className="text-faint">
            <Icon name="search" size={14} />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("startMenu.searchPlaceholder")}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {results.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-text-dim">
            {t("startMenu.noResults")}
          </p>
        )}
        {results.map((a) => (
          <button
            key={a.id}
            role="menuitem"
            onClick={() => launch(a.id, a.name, a.defaultSize)}
            className={cn(
              "flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left transition-colors",
              "hover:bg-surface-3",
            )}
          >
            <AppIcon app={a} size={36} />
            <span className="flex flex-col">
              <span className="text-sm text-text">{t(a.name)}</span>
              {a.description && (
                <span className="text-[11px] text-text-dim">
                  {t(a.description)}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
