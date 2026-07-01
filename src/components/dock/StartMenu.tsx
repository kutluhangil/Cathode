"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { AppIcon } from "@/components/ui/AppIcon";
import { cn } from "@/lib/cn";

interface Props {
  onClose: () => void;
}

/** Cathode menüsü — uygulama listesi + arama ("Start" yazmaz). */
export function StartMenu({ onClose }: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const open = useWindows((s) => s.open);

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
        a.name.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term),
    );
  }, [q]);

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
      className="absolute bottom-full left-0 z-[3000] mb-3 w-80 origin-bottom-left overflow-hidden rounded-[14px] border border-border bg-glass shadow-win"
    >
      <div className="border-b border-border-soft p-3">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="uygulama ara…"
          className="w-full rounded-[8px] border border-border bg-black/30 px-3 py-2 text-sm text-text outline-none placeholder:text-text-dim/60 focus:border-accent"
        />
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {results.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-text-dim">
            sonuç yok
          </p>
        )}
        {results.map((a) => (
          <button
            key={a.id}
            role="menuitem"
            onClick={() => launch(a.id, a.name, a.defaultSize)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-colors",
              "hover:bg-accent/15",
            )}
          >
            <AppIcon app={a} size={36} />
            <span className="flex flex-col">
              <span className="text-sm text-text">{a.name}</span>
              {a.description && (
                <span className="text-[11px] text-text-dim">
                  {a.description}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
