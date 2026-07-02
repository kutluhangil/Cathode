"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useMotionEnabled } from "@/lib/motion";
import { CathodeMark } from "@/components/icons";

/** Hareketsizlik eşiği (ms) — 3 dakika */
const IDLE_MS = 3 * 60 * 1000;

/**
 * Fosfor ekran koruyucu — idle'da sekip duran Cathode markası (DVD tarzı).
 * Herhangi bir giriş kapatır. Hareket kapalıysa (ayar ya da
 * prefers-reduced-motion) hiç devreye girmez. CRT overlay'lerinin altında
 * kalır — scanline/vinyet koruyucunun üstünde de hissedilir.
 */
export function Screensaver() {
  const enabled = useSettings((s) => s.screensaver);
  const motionOn = useMotionEnabled();
  const [active, setActive] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // idle takibi
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

  // sekme animasyonu (rAF — kütüphanesiz)
  useEffect(() => {
    if (!active) return;
    const el = boxRef.current;
    if (!el) return;
    const size = 140;
    let x = Math.random() * (window.innerWidth - size);
    let y = Math.random() * (window.innerHeight - size);
    let vx = 1.6;
    let vy = 1.3;
    let raf = 0;
    const step = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      x += vx;
      y += vy;
      if (x <= 0 || x >= vw - size) vx = -vx;
      if (y <= 0 || y >= vh - size) vy = -vy;
      el.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[9000] cursor-none bg-[#030304]"
    >
      <div
        ref={boxRef}
        className="phosphor flex w-[140px] flex-col items-center gap-2 text-accent will-change-transform"
      >
        <CathodeMark size={72} />
        <span className="font-mono text-[11px] tracking-[0.3em] text-text-dim">
          cathode
        </span>
      </div>
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest text-faint">
        devam etmek için bir tuşa bas
      </span>
    </div>
  );
}
