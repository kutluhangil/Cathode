"use client";

import { useSettings } from "@/store/settingsStore";

/**
 * Özgün, koda dayalı duvar kâğıtları — hiçbir telifli görsel yok.
 * accent değişkenine tepki verir; CRT'siz de premium görünür.
 */
export function Wallpaper() {
  const wallpaper = useSettings((s) => s.wallpaper);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-desk">
      {wallpaper === "horizon" && <Horizon />}
      {wallpaper === "aurora" && <Aurora />}
      {wallpaper === "grid" && <Grid />}
      {wallpaper === "monolith" && <Monolith />}
    </div>
  );
}

/** Synthwave ufuk — parlayan güneş + perspektif ızgara + yıldızlar. */
function Horizon() {
  return (
    <div className="absolute inset-0">
      {/* gökyüzü */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a16] via-[#140b1f] to-[#050308]" />
      {/* mor sis */}
      <div className="absolute left-1/2 top-[18%] h-[45vh] w-[80vw] -translate-x-1/2 rounded-full bg-[#5a2a7a] opacity-30 blur-[130px]" />
      {/* yıldızlar */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1px 1px at 40% 50%, #cfe, transparent), radial-gradient(1px 1px at 85% 40%, #fff, transparent), radial-gradient(1px 1px at 55% 15%, #fff, transparent), radial-gradient(1px 1px at 12% 60%, #fff, transparent)",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* güneş */}
      <div className="absolute left-1/2 top-[40%] h-[34vh] w-[34vh] -translate-x-1/2 -translate-y-1/2">
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, #ffd27a 0%, var(--accent) 45%, #ff5a3c 100%)",
            boxShadow: "0 0 120px var(--accent-glow)",
          }}
        />
        {/* güneş üzerindeki tarama çizgileri */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "repeating-linear-gradient(180deg, transparent 0 8px, #050308 8px 12px)",
            maskImage: "radial-gradient(circle, #000 60%, transparent 62%)",
            opacity: 0.5,
          }}
        />
      </div>
      {/* zemin + perspektif ızgara */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-[#0a0512]" />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1.5px, transparent 1.5px), linear-gradient(90deg, var(--accent) 1.5px, transparent 1.5px)",
          backgroundSize: "64px 40px",
          transform: "perspective(38vh) rotateX(72deg)",
          transformOrigin: "bottom",
          opacity: 0.35,
          maskImage: "linear-gradient(to top, #000 20%, transparent 90%)",
        }}
      />
    </div>
  );
}

function Aurora() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b14] to-[#050507]" />
      <div
        className="absolute -left-1/4 top-[-20%] h-[75vh] w-[75vw] rounded-full opacity-45 blur-[120px]"
        style={{ background: "var(--accent)" }}
      />
      <div className="absolute bottom-[-25%] right-[-10%] h-[65vh] w-[60vw] rounded-full bg-[#1f3aa0] opacity-55 blur-[120px]" />
      <div className="absolute left-1/3 top-1/4 h-[45vh] w-[45vw] rounded-full bg-[#6a1d8a] opacity-40 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
    </div>
  );
}

function Grid() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#050507]">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(130% 130% at 50% 40%, #000 30%, transparent 78%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[55vh] w-[55vh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[110px]"
        style={{ background: "var(--accent)" }}
      />
    </div>
  );
}

function Monolith() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0c0c12] to-[#050508]" />
      <div
        className="absolute left-1/2 top-1/2 h-[60vh] w-[20vh] -translate-x-1/2 -translate-y-1/2 rounded-[4px]"
        style={{
          background: "linear-gradient(180deg,#17171f 0%,#0b0b10 100%)",
          boxShadow: "0 0 90px var(--accent-glow), 0 40px 120px rgba(0,0,0,0.85)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[60vh] w-px -translate-x-1/2 -translate-y-1/2 opacity-70"
        style={{ background: "var(--accent)" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}
