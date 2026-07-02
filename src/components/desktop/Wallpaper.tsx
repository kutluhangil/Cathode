"use client";

import { useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { getGalleryPhoto } from "@/data/wallpapers";

/**
 * Cathode Workstation duvar kâğıtları (v2) — hepsi kod-çizimi, accent'e duyarlı.
 * phosphor: açık ama boş ekran hissi · blueprint: 5100 teknik çizimi ·
 * testcard: özgün test kartı · void: saf minimal · photo: rastgele 4K ·
 * galeri (alpenglow/dolomites/stormline): yerelde gömülü sabit fotoğraflar.
 */
export function Wallpaper() {
  const wallpaper = useSettings((s) => s.wallpaper);
  const photoSeed = useSettings((s) => s.photoSeed);
  const galleryPhoto = getGalleryPhoto(wallpaper);

  return (
    // z-0 + DOM'da ilk çocuk: negatif z-index, üst sarmalayıcı (CRT bloom
    // transform/filter) stacking context'inde bg-desk arkasına düşüyordu.
    <div className="absolute inset-0 z-0 overflow-hidden bg-desk">
      {wallpaper === "phosphor" && <Phosphor />}
      {wallpaper === "blueprint" && <Blueprint />}
      {wallpaper === "testcard" && <Testcard />}
      {wallpaper === "void" && <Void />}
      {wallpaper === "photo" && <Photo seed={photoSeed} />}
      {galleryPhoto && <GalleryWallpaper src={galleryPhoto.src} />}
    </div>
  );
}

/** Sabit galeri fotoğrafı — yerel, anahtarsız statik dosya. */
function GalleryWallpaper({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 bg-[#050507]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
    </div>
  );
}

/**
 * Rastgele 4K fotoğraf. Önce Unsplash (source.unsplash.com), yüklenmezse
 * Lorem Picsum'a düşer (ikisi de anahtarsız/ücretsiz). seed her yenilemede artar.
 * next/image değil — harici, anahtarsız kaynak; COEP credentialless ile yüklenir.
 */
function Photo({ seed }: { seed: number }) {
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);

  const src = fallback
    ? `https://picsum.photos/seed/cathode${seed}/3840/2160`
    : `https://source.unsplash.com/random/3840x2160?wallpaper,landscape&sig=${seed}`;

  return (
    <div className="absolute inset-0 bg-[#050507]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        aria-hidden
        onLoad={() => setLoaded(true)}
        onError={() => (fallback ? undefined : setFallback(true))}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* okunabilirlik için hafif karartma + vinyet */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/55" />
    </div>
  );
}

/** Fosfor — merkezden yayılan ışıma + ince grille dokusu. Varsayılan. */
function Phosphor() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0d]">
      {/* merkez fosfor ışıma */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% 46%, var(--accent) 0%, transparent 62%)",
          opacity: 0.09,
        }}
      />
      <div
        className="absolute left-1/2 top-[46%] h-[26vh] w-[26vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{ background: "var(--accent)", opacity: 0.14 }}
      />
      {/* ince dikey grille dokusu — merkeze maskeli */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--accent) 0 1px, transparent 1px 5px)",
          opacity: 0.05,
          maskImage:
            "radial-gradient(110% 90% at 50% 46%, #000 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(110% 90% at 50% 46%, #000 20%, transparent 75%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
    </div>
  );
}

/** Blueprint — Cathode 5100 monitörünün mühendislik şeması. */
function Blueprint() {
  return (
    <div className="absolute inset-0 bg-[#090b0f]">
      {/* ince + kalın teknik ızgara */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.045,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.07,
        }}
      />
      {/* teknik çizim — ön görünüş + ölçü okları */}
      <svg
        viewBox="0 0 400 300"
        className="absolute left-1/2 top-1/2 h-[62vh] w-auto -translate-x-1/2 -translate-y-1/2"
        style={{ color: "var(--accent)", opacity: 0.5 }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        aria-hidden
      >
        {/* gövde */}
        <rect x="90" y="40" width="220" height="170" rx="14" />
        {/* ekran */}
        <rect x="112" y="58" width="176" height="126" rx="8" strokeDasharray="none" />
        <rect x="120" y="65" width="160" height="112" rx="6" strokeWidth="0.5" opacity="0.6" />
        {/* merkez işaretleri */}
        <path d="M200 108v28M186 122h28" strokeWidth="0.5" opacity="0.7" />
        <circle cx="200" cy="122" r="20" strokeWidth="0.5" opacity="0.5" />
        {/* alt plaka + LED */}
        <path d="M112 196h120" strokeWidth="0.6" opacity="0.7" />
        <circle cx="286" cy="196" r="2.4" fill="currentColor" stroke="none" opacity="0.9" />
        {/* ayak */}
        <path d="M160 210v18h80v-18M140 236h120" />
        {/* ölçü okları — genişlik */}
        <path d="M90 258h220M90 252v12M310 252v12" strokeWidth="0.6" />
        <path d="M90 258l8-3v6l-8-3ZM310 258l-8-3v6l8-3Z" fill="currentColor" stroke="none" />
        {/* ölçü okları — yükseklik */}
        <path d="M62 40v170M56 40h12M56 210h12" strokeWidth="0.6" />
        <path d="M62 40l-3 8h6l-3-8ZM62 210l-3-8h6l3 8Z" fill="currentColor" stroke="none" />
        {/* etiketler */}
        <text x="188" y="274" fontSize="9" fill="currentColor" stroke="none" fontFamily="var(--font-mono), monospace">
          340 mm
        </text>
        <text x="30" y="128" fontSize="9" fill="currentColor" stroke="none" fontFamily="var(--font-mono), monospace" transform="rotate(-90 38 128)">
          262 mm
        </text>
        <text x="90" y="30" fontSize="10" fill="currentColor" stroke="none" fontFamily="var(--font-mono), monospace" letterSpacing="2">
          cathode systems · model 5100
        </text>
        <text x="310" y="290" fontSize="8" fill="currentColor" stroke="none" fontFamily="var(--font-mono), monospace" opacity="0.7">
          rev 2.0 · 1989
        </text>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />
    </div>
  );
}

/** Test kartı — özgün kalibrasyon kompozisyonu (SMPTE kopyası değil). */
function Testcard() {
  // fosfor parlaklık basamakları — accent'in siyaha karışımı
  const steps = [92, 72, 54, 38, 22, 10];
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050506]">
      <div
        className="relative h-[58vmin] w-[82vmin] overflow-hidden rounded-[6px]"
        style={{ boxShadow: "0 0 0 1px var(--border-soft), 0 0 90px rgba(0,0,0,0.6)" }}
      >
        {/* dikey parlaklık bantları */}
        <div className="absolute inset-x-0 top-0 flex h-[72%]">
          {steps.map((p) => (
            <div
              key={p}
              className="h-full flex-1"
              style={{
                background: `color-mix(in srgb, var(--accent) ${p}%, #050506)`,
              }}
            />
          ))}
        </div>
        {/* alt kalibrasyon şeridi — gri basamaklar */}
        <div className="absolute inset-x-0 bottom-0 flex h-[28%]">
          {[8, 22, 38, 54, 72, 90].map((p) => (
            <div
              key={p}
              className="h-full flex-1"
              style={{
                background: `color-mix(in srgb, #e9e6de ${p}%, #050506)`,
              }}
            />
          ))}
        </div>
        {/* merkez crosshair + daire */}
        <svg
          viewBox="0 0 100 100"
          className="absolute left-1/2 top-[36%] h-[34vmin] w-[34vmin] -translate-x-1/2 -translate-y-1/2"
          fill="none"
          stroke="#050506"
          strokeWidth="1"
          aria-hidden
        >
          <circle cx="50" cy="50" r="34" />
          <circle cx="50" cy="50" r="24" strokeWidth="0.5" />
          <path d="M50 8v84M8 50h84" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="2" fill="#050506" stroke="none" />
        </svg>
        {/* damga */}
        <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#050506]/85 px-3 py-1 font-mono text-[10px] tracking-[0.25em] text-text-dim">
          cathode systems · test signal
        </div>
      </div>
    </div>
  );
}

/** Void — saf minimal; dikkat dağıtmaz. */
function Void() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 38%, #0d0d12 0%, #050506 78%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[40%] h-[40vh] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{ background: "var(--accent)", opacity: 0.04 }}
      />
    </div>
  );
}
