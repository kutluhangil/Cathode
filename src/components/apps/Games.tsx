"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_LIST, type GameDefinition } from "@/data/games";
import { useWindows } from "@/store/windowsStore";
import { cn } from "@/lib/cn";
import { LazyJsDos } from "./emulator/LazyJsDos";

const SIZE = { w: 720, h: 540 };

export function Games() {
  const open = useWindows((s) => s.open);
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
          className="shrink-0 border-b border-border-soft px-3 py-1.5 text-left font-mono text-[11px] text-text-dim hover:text-text"
        >
          ‹ oyunlara dön
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
        description: "kendi oyunun",
        bundle: { url },
        enabled: true,
        license: "kullanıcı içeriği — yalnız bu tarayıcıda",
      },
      url,
    });
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <h2 className="phosphor mb-1 text-lg font-semibold tracking-tight text-text">
        Oyunlar
      </h2>
      <p className="mb-5 text-xs text-text-dim">
        DOSBox-X üzerinde, tarayıcıda. Yalnızca telifsiz/serbest içerik.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {GAME_LIST.map((g) => (
          <div
            key={g.id}
            className={cn(
              "rounded-[12px] border bg-surface/50 p-4",
              g.enabled
                ? "border-border hover:border-accent/60"
                : "border-border-soft opacity-60",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg text-accent">{g.glyph}</span>
              <span className="text-sm text-text">{g.name}</span>
              {!g.enabled && (
                <span className="ml-auto rounded-full border border-border-soft px-2 py-0.5 font-mono text-[9px] text-text-dim">
                  yakında
                </span>
              )}
            </div>
            <p className="mb-3 h-8 text-[11px] leading-tight text-text-dim">
              {g.description}
            </p>
            <button
              disabled={!g.enabled}
              onClick={() => open(`game-${g.id}`, g.name, SIZE)}
              className={cn(
                "w-full rounded-[8px] py-1.5 text-xs font-medium transition-colors",
                g.enabled
                  ? "bg-accent text-accent-ink hover:brightness-110"
                  : "cursor-not-allowed bg-white/5 text-text-dim",
              )}
            >
              {g.enabled ? "oyna" : "bundle hazırlanıyor"}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-dim">
          kendi oyununu yükle
        </h3>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-border py-6 text-center transition-colors hover:border-accent/50">
          <span className="text-xl text-text-dim">✦</span>
          <span className="text-xs text-text">.jsdos / .zip seç</span>
          <span className="text-[10px] text-text-dim">
            sunucuya gitmez — yalnız senin tarayıcında çalışır
          </span>
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
