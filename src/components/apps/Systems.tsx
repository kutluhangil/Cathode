"use client";

import { useState } from "react";
import { OS_LIST, type OsDefinition, type DiskDrive } from "@/data/os";
import { useWindows } from "@/store/windowsStore";
import { cn } from "@/lib/cn";
import { LazyEmulator } from "./emulator/LazyEmulator";

const EMU_SIZE = { w: 760, h: 560 };

export function Systems() {
  const open = useWindows((s) => s.open);
  const [byoi, setByoi] = useState<{
    os: OsDefinition;
    buffer: ArrayBuffer;
  } | null>(null);

  // BYOI çalışırken pencere içeriği emülatöre döner
  if (byoi) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => setByoi(null)}
          className="shrink-0 border-b border-border-soft px-3 py-1.5 text-left font-mono text-[11px] text-text-dim hover:text-text"
        >
          ‹ kataloğa dön
        </button>
        <div className="flex-1">
          <LazyEmulator os={byoi.os} override={byoi.buffer} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <h2 className="phosphor mb-1 text-lg font-semibold tracking-tight text-text">
        Sistemler
      </h2>
      <p className="mb-5 text-xs text-text-dim">
        Tarayıcıda, izole çalışır. Emüle sistemler internete bağlı değildir.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {OS_LIST.map((os) => (
          <div
            key={os.id}
            className={cn(
              "rounded-[12px] border bg-surface/50 p-4 transition-colors",
              os.enabled
                ? "border-border hover:border-accent/60"
                : "border-border-soft opacity-60",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg text-accent">{os.glyph}</span>
              <span className="text-sm text-text">{os.name}</span>
              {!os.enabled && (
                <span className="ml-auto rounded-full border border-border-soft px-2 py-0.5 font-mono text-[9px] text-text-dim">
                  yakında
                </span>
              )}
            </div>
            <p className="mb-3 h-8 text-[11px] leading-tight text-text-dim">
              {os.description}
            </p>
            <button
              disabled={!os.enabled}
              onClick={() => open(`os-${os.id}`, os.name, EMU_SIZE)}
              className={cn(
                "w-full rounded-[8px] py-1.5 text-xs font-medium transition-colors",
                os.enabled
                  ? "bg-accent text-accent-ink hover:brightness-110"
                  : "cursor-not-allowed bg-white/5 text-text-dim",
              )}
            >
              {os.enabled ? "aç" : "imaj hazırlanıyor"}
            </button>
          </div>
        ))}
      </div>

      <ByoiDrop onLoad={(os, buffer) => setByoi({ os, buffer })} />
    </div>
  );
}

function ByoiDrop({
  onLoad,
}: {
  onLoad: (os: OsDefinition, buffer: ArrayBuffer) => void;
}) {
  const [drive, setDrive] = useState<DiskDrive>("hda");
  const [over, setOver] = useState(false);

  const handle = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const os: OsDefinition = {
      id: "byoi",
      name: file.name,
      glyph: "⊕",
      description: "kendi imajın",
      engine: "v86",
      drive,
      image: { url: "" },
      memoryMB: 512,
      vgaMB: 32,
      enabled: true,
      license: "kullanıcı imajı — yalnız bu tarayıcıda",
    };
    onLoad(os, buffer);
  };

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-text-dim">
          kendi imajını yükle
        </h3>
        <div className="flex overflow-hidden rounded-[6px] border border-border text-[10px]">
          {(["hda", "fda", "cdrom"] as DiskDrive[]).map((d) => (
            <button
              key={d}
              onClick={() => setDrive(d)}
              className={cn(
                "px-2 py-0.5 font-mono uppercase",
                drive === d
                  ? "bg-accent text-accent-ink"
                  : "text-text-dim hover:text-text",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f) void handle(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed py-6 text-center transition-colors",
          over ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
        )}
      >
        <span className="text-xl text-text-dim">⊕</span>
        <span className="text-xs text-text">
          .img / .iso sürükle ya da seç
        </span>
        <span className="text-[10px] text-text-dim">
          dosya sunucuya gitmez — yalnız senin tarayıcında çalışır
        </span>
        <input
          type="file"
          accept=".img,.iso,.bin"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handle(f);
          }}
        />
      </label>
    </div>
  );
}
