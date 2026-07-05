"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_LIST, type GameDefinition } from "@/data/games";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/components/ui/AppIcon";
import { Icon } from "@/components/icons";
import { LazyJsDos } from "./emulator/LazyJsDos";

const SIZE = { w: 720, h: 540 };

export function Games() {
  const open = useWindows((s) => s.open);
  const t = useT();
  const [byog, setByog] = useState<{
    game: GameDefinition;
    url: string;
  } | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  if (byog) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => setByog(null)}
          className="flex shrink-0 items-center gap-1.5 border-b border-border-soft px-3 py-1.5 text-left font-mono text-[11px] text-text-dim hover:text-text"
        >
          <Icon name="chevron-left" size={11} /> {t("games.back")}
        </button>
        <div className="flex-1">
          <LazyJsDos game={byog.game} override={byog.url} />
        </div>
      </div>
    );
  }

  const loadFile = (file: File) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setByog({
      game: {
        id: "byog",
        name: file.name,
        glyph: "✦",
        description: t("games.byogDesc"),
        bundle: { url },
        enabled: true,
        license: t("games.byogLicense"),
      },
      url,
    });
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <h2 className="phosphor mb-1 text-lg font-semibold tracking-tight text-text">
        {t("games.title")}
      </h2>
      <p className="mb-5 text-xs text-text-dim">{t("games.intro")}</p>

      <div className="grid grid-cols-2 gap-3">
        {GAME_LIST.map((g) => (
          <div
            key={g.id}
            className={cn(
              "rounded-ui border bg-surface-0 p-4",
              g.enabled
                ? "border-border-soft hover:border-accent/60"
                : "border-border-soft opacity-60",
            )}
          >
            <div className="mb-2 flex items-center gap-2.5">
              <AppIcon app={{ id: `game-${g.id}` }} size={22} />
              <span className="text-sm text-text">{t(g.name)}</span>
              {!g.enabled && (
                <span className="ml-auto rounded-btn border border-border-soft px-2 py-0.5 font-mono text-[9px] text-text-dim">
                  {t("games.badgeSoon")}
                </span>
              )}
            </div>
            <p className="mb-3 h-8 text-[11px] leading-tight text-text-dim">
              {t(g.description)}
            </p>
            <button
              disabled={!g.enabled}
              onClick={() => open(`game-${g.id}`, g.name, SIZE)}
              className={cn(
                "w-full rounded-btn py-1.5 text-xs font-medium transition-colors",
                g.enabled
                  ? "bg-accent text-accent-ink hover:brightness-110"
                  : "cursor-not-allowed bg-surface-2 text-faint",
              )}
            >
              {g.enabled ? t("games.play") : t("games.preparing")}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-dim">
          {t("games.byogTitle")}
        </h3>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-ui border border-dashed border-border py-6 text-center transition-colors hover:border-accent/50">
          <span className="text-text-dim">
            <Icon name="upload" size={20} />
          </span>
          <span className="text-xs text-text">{t("games.byogPick")}</span>
          <span className="text-[10px] text-text-dim">{t("games.byogNote")}</span>
          <input
            type="file"
            accept=".jsdos,.zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadFile(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}
