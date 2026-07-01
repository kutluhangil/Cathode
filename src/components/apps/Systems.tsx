"use client";

import { useState } from "react";
import { OS_LIST, type OsDefinition, type DiskDrive } from "@/data/os";
import { useWindows } from "@/store/windowsStore";
import { cn } from "@/lib/cn";
import { LazyEmulator } from "./emulator/LazyEmulator";

const EMU_SIZE = { w: 760, h: 560 };

interface RunTarget {
  os: OsDefinition;
  buffer?: ArrayBuffer; // dosya yüklemede dolu; URL'de boş (os.image.url streamlenir)
}

export function Systems() {
  const open = useWindows((s) => s.open);
  const [run, setRun] = useState<RunTarget | null>(null);

  if (run) {
    return (
      <div className="flex h-full flex-col">
        <button
          onClick={() => setRun(null)}
          className="shrink-0 border-b border-border-soft px-3 py-1.5 text-left font-mono text-[11px] text-text-dim hover:text-text"
        >
          ‹ kataloğa dön
        </button>
        <div className="flex-1">
          <LazyEmulator os={run.os} override={run.buffer} />
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

      {/* Kendi imajını aç — öne çıkan */}
      <ByoiCard onRun={setRun} />

      <h3 className="mb-2 mt-6 font-mono text-[11px] uppercase tracking-widest text-text-dim">
        hazır sistemler
      </h3>
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
    </div>
  );
}

function ByoiCard({ onRun }: { onRun: (t: RunTarget) => void }) {
  const [tab, setTab] = useState<"dosya" | "url">("dosya");
  const [drive, setDrive] = useState<DiskDrive>("hda");
  const [url, setUrl] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const makeOs = (name: string, image: OsDefinition["image"]): OsDefinition => ({
    id: "byoi",
    name,
    glyph: "⊕",
    description: "kendi imajın",
    engine: "v86",
    drive,
    image,
    memoryMB: 512,
    vgaMB: 32,
    enabled: true,
    license: "kullanıcı imajı — yalnız bu tarayıcıda",
  });

  const runFile = async (file: File) => {
    setErr(null);
    const buffer = await file.arrayBuffer();
    onRun({ os: makeOs(file.name, { url: "" }), buffer });
  };

  const runUrl = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setErr(null);
    try {
      // boyutu öğren → range ile parça parça (büyük XP imajları için ideal)
      let size = 0;
      try {
        const head = await fetch(u, { method: "HEAD" });
        size = Number(head.headers.get("content-length") ?? 0);
      } catch {
        /* HEAD engellenebilir; async'siz tam indirmeye düşeriz */
      }
      const name = u.split("/").pop() || "uzak imaj";
      const image =
        size > 0
          ? { url: u, async: true as const, size }
          : { url: u };
      onRun({ os: makeOs(name, image) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "yüklenemedi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[14px] border border-accent/40 bg-accent/[0.04] p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-lg text-accent">⊕</span>
        <h3 className="text-sm font-medium text-text">
          Kendi işletim sistemini aç
        </h3>
      </div>
      <p className="mb-3 text-[11px] leading-tight text-text-dim">
        Windows XP dahil kendi <code>.img/.iso</code> imajın. Sunucuya gitmez,
        yalnızca senin tarayıcında izole çalışır.
      </p>

      {/* sekmeler + disk türü */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex overflow-hidden rounded-[7px] border border-border text-[11px]">
          {(["dosya", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1 font-mono uppercase",
                tab === t
                  ? "bg-accent text-accent-ink"
                  : "text-text-dim hover:text-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-[7px] border border-border text-[10px]">
          {(["hda", "fda", "cdrom"] as DiskDrive[]).map((d) => (
            <button
              key={d}
              onClick={() => setDrive(d)}
              title={d === "hda" ? "sabit disk" : d === "fda" ? "disket" : "CD"}
              className={cn(
                "px-2 py-1 font-mono uppercase",
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

      {tab === "dosya" ? (
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
            if (f) void runFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed py-6 text-center transition-colors",
            over ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
          )}
        >
          <span className="text-xl text-text-dim">⊕</span>
          <span className="text-xs text-text">.img / .iso sürükle ya da seç</span>
          <input
            type="file"
            accept=".img,.iso,.bin"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void runFile(f);
            }}
          />
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runUrl()}
            placeholder="https://.../winxp.img"
            className="flex-1 rounded-[8px] border border-border bg-black/30 px-3 py-2 text-xs text-text outline-none placeholder:text-text-dim/60 focus:border-accent"
          />
          <button
            onClick={runUrl}
            disabled={busy || !url.trim()}
            className="rounded-[8px] bg-accent px-3 py-2 text-xs font-medium text-accent-ink disabled:opacity-40"
          >
            {busy ? "…" : "aç"}
          </button>
        </div>
      )}

      {tab === "url" && (
        <p className="mt-2 text-[10px] leading-tight text-text-dim/80">
          URL, CORS izni veren bir kaynakta olmalı (kendi R2/sunucun gibi).
        </p>
      )}
      {err && <p className="mt-2 text-[11px] text-[#ff5f56]">{err}</p>}
    </div>
  );
}
