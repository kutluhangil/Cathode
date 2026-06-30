"use client";

import { useSettings } from "@/store/settingsStore";
import { cn } from "@/lib/cn";

/**
 * Özgün, koda dayalı duvar kâğıtları — hiçbir telifli görsel yok.
 * accent değişkenine tepki verir; CRT'siz de premium görünür.
 */
export function Wallpaper() {
  const wallpaper = useSettings((s) => s.wallpaper);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-desk">
      {wallpaper === "aurora" && <Aurora />}
      {wallpaper === "grid" && <Grid />}
      {wallpaper === "monolith" && <Monolith />}
      {/* derinlik için hafif üst karartma */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
    </div>
  );
}

function Aurora() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute -left-1/4 top-[-20%] h-[70vh] w-[70vw] rounded-full opacity-30 blur-[120px]"
        style={{ background: "var(--accent)" }}
      />
      <div className="absolute bottom-[-25%] right-[-10%] h-[60vh] w-[55vw] rounded-full bg-[#1d2b4a] opacity-50 blur-[120px]" />
      <div className="absolute left-1/3 top-1/4 h-[40vh] w-[40vw] rounded-full bg-[#3a1d4a] opacity-30 blur-[120px]" />
    </div>
  );
}

function Grid() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(120% 120% at 50% 40%, #000 35%, transparent 80%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[50vh] w-[50vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
        style={{ background: "var(--accent)" }}
      />
    </div>
  );
}

function Monolith() {
  return (
    <div className={cn("absolute inset-0")}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0c0c12] to-[#06060a]" />
      <div
        className="absolute left-1/2 top-1/2 h-[58vh] w-[20vh] -translate-x-1/2 -translate-y-1/2 rounded-[4px] opacity-90"
        style={{
          background:
            "linear-gradient(180deg, #15151c 0%, #0b0b10 100%)",
          boxShadow: "0 0 80px var(--accent-glow), 0 40px 120px rgba(0,0,0,0.8)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[58vh] w-px -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{ background: "var(--accent)" }}
      />
    </div>
  );
}
