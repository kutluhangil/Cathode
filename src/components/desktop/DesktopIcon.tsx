"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";
import { AppIcon } from "@/components/ui/AppIcon";
import type { AppDefinition } from "@/lib/types";
import { useSettings } from "@/store/settingsStore";
import { useDesktop } from "@/store/desktopStore";

interface Props {
  app: AppDefinition;
  onOpen: () => void;
}

export function DesktopIcon({ app, onOpen }: Props) {
  const t = useT();
  const desktopIconSize = useSettings((s) => s.desktopIconSize);
  const selected = useDesktop((s) => s.selectedIds.has(app.id));
  const toggleSelection = useDesktop((s) => s.toggleSelection);

  return (
    <button
      data-testid={`desktop-icon-${app.id}`}
      data-desktop-icon="true"
      data-id={app.id}
      onDoubleClick={onOpen}
      onClick={(e) => toggleSelection(app.id, e.shiftKey || e.metaKey || e.ctrlKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      aria-label={t(app.name)}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center outline-none transition-colors",
        selected ? "bg-accent/15" : "hover:bg-white/5",
      )}
      style={{ width: desktopIconSize + 32 }}
    >
      <span
        className={cn(
          "rounded-[14px] p-0.5 transition-all duration-200",
          selected
            ? "ring-2 ring-accent/70"
            : "group-hover:-translate-y-0.5 group-hover:scale-105",
        )}
        aria-hidden
      >
        <AppIcon app={app} size={desktopIconSize} />
      </span>
      <span className="line-clamp-2 text-[11px] leading-tight text-text/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {t(app.name)}
      </span>
    </button>
  );
}
