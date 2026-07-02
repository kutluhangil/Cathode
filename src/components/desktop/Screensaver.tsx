"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useMotionEnabled } from "@/lib/motion";

/** Hareketsizlik eşiği (ms) — 3 dakika */
const IDLE_MS = 3 * 60 * 1000;

/**
 * Aerial ekran koruyucu — yavaşça dolaşan, soyut akışkan gradient bulutları
 * (Apple tvOS aerial tarzı). Marka/logo yok, saf hareket. Herhangi bir giriş
 * kapatır. Hareket kapalıysa (ayar ya da prefers-reduced-motion) hiç
 * devreye girmez — animasyon CSS keyframe ile sürer, JS döngüsü yok.
 */
export function Screensaver() {
  const enabled = useSettings((s) => s.screensaver);
  const motionOn = useMotionEnabled();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || !motionOn) {
      setActive(false);
      return;
    }
    let timer = setTimeout(() => setActive(true), IDLE_MS);
    const reset = () => {
      setActive(false);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(true), IDLE_MS);
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [enabled, motionOn]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9000] cursor-none overflow-hidden bg-[#030304]"
    >
      <div
        className="aerial-blob-1 absolute left-[14%] top-[22%] h-[40vw] w-[40vw] rounded-full blur-[100px]"
        style={{ background: "var(--accent)", opacity: 0.42 }}
      />
      <div
        className="aerial-blob-2 absolute right-[10%] top-[12%] h-[34vw] w-[34vw] rounded-full blur-[95px]"
        style={{
          background: "color-mix(in srgb, var(--accent) 30%, #2b6cff 70%)",
          opacity: 0.36,
        }}
      />
      <div
        className="aerial-blob-3 absolute bottom-[6%] left-[42%] h-[36vw] w-[36vw] rounded-full blur-[105px]"
        style={{
          background: "color-mix(in srgb, var(--accent) 45%, #ff2ea6 55%)",
          opacity: 0.3,
        }}
      />
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest text-faint">
        devam etmek için bir tuşa bas
      </span>
    </div>
  );
}
