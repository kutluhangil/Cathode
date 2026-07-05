"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useUiStore } from "@/store/uiStore";
import { useT } from "@/lib/i18n/useT";
import { useMotionEnabled } from "@/lib/motion";

/** Hareketsizlik eşiği (ms) — 3 dakika */
const IDLE_MS = 3 * 60 * 1000;

/**
 * Aerial ekran koruyucu — yavaşça dolaşan, soyut akışkan gradient bulutları
 * (Apple tvOS aerial tarzı). Marka/logo yok, saf hareket. Herhangi bir giriş
 * kapatır. Hareket kapalıysa (ayar ya da prefers-reduced-motion) hiç
 * devreye girmez — animasyon CSS keyframe ile sürer, JS döngüsü yok.
 *
 * Ayarlar'daki "şimdi önizle" butonu `previewing`'i tetikler — idle/hareket
 * ayarlarından bağımsız, Windows'taki ekran koruyucu Preview düğmesi gibi.
 */
export function Screensaver() {
  const enabled = useSettings((s) => s.screensaver);
  const motionOn = useMotionEnabled();
  const t = useT();
  const previewToken = useUiStore((s) => s.screensaverPreviewToken);
  const [active, setActive] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const firstPreview = useRef(true);

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

  // "şimdi önizle" — ilk mount'ta tetiklenmesin, sadece token artınca.
  useEffect(() => {
    if (firstPreview.current) {
      firstPreview.current = false;
      return;
    }
    setPreviewing(true);
  }, [previewToken]);

  // önizleme sırasında, tetikleyen tıklamanın kendisi hemen kapatmasın diye
  // kısa bir gecikmeyle dinleyici kur; sonraki tuş/tık/dokunuş kapatır.
  useEffect(() => {
    if (!previewing) return;
    const dismiss = () => setPreviewing(false);
    const events = ["pointerdown", "keydown", "touchstart"];
    const arm = setTimeout(() => {
      events.forEach((ev) => window.addEventListener(ev, dismiss, { passive: true }));
    }, 250);
    return () => {
      clearTimeout(arm);
      events.forEach((ev) => window.removeEventListener(ev, dismiss));
    };
  }, [previewing]);

  if (!active && !previewing) return null;

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
        {t("screensaver.dismiss")}
      </span>
    </div>
  );
}
