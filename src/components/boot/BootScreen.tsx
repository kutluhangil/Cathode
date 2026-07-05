"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useT } from "@/lib/i18n/useT";
import { CathodeMark } from "@/components/icons";

interface Props {
  onDone: () => void;
}

/** POST cihaz satırları — bellek testinden sonra sırayla düşer. */
const PROBES = [
  "phosphor display .......... ok",
  "window manager ............ ok",
  "mounting shell ............ ok",
];

const MEM_MAX = 8192; // K

/** CRT tüp ısınması — perde açılışı süresi (ms). Spec §4: "opsiyonel kısa flicker". */
const POWERON_MS = 480;

/**
 * Boot v3 — CRT güç açılışı (perde + flicker) → gerçek donanım POST sekansı
 * (~3.4s toplam, tıkla atla). Tüp ısınması → BIOS başlığı → bellek sayacı →
 * cihaz probe → marka bloom (fosfor ateşlemesi) → masaüstü.
 */
export function BootScreen({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const t = useT();
  const [mem, setMem] = useState<number | null>(null); // null = test başlamadı
  const [probeStep, setProbeStep] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const memTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (ms: number) => POWERON_MS + ms;

    // bellek sayacı: 640K → 8192K
    timers.push(
      setTimeout(() => {
        setMem(640);
        memTimer.current = setInterval(() => {
          setMem((m) => {
            const next = (m ?? 640) + 472;
            if (next >= MEM_MAX) {
              if (memTimer.current) clearInterval(memTimer.current);
              return MEM_MAX;
            }
            return next;
          });
        }, 24);
      }, t(150)),
    );

    // cihaz probe satırları
    PROBES.forEach((_, i) => {
      timers.push(setTimeout(() => setProbeStep(i + 1), t(760 + i * 240)));
    });

    // marka bloom + bitiş
    timers.push(setTimeout(() => setShowBrand(true), t(1500)));
    timers.push(setTimeout(onDone, t(2450)));

    return () => {
      timers.forEach(clearTimeout);
      if (memTimer.current) clearInterval(memTimer.current);
    };
  }, [reduced, onDone]);

  const memDone = mem === MEM_MAX;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onDone}
      role="button"
      aria-label={t("boot.skipAria")}
      className="fixed inset-0 z-[8000] flex cursor-pointer flex-col items-center justify-center bg-void"
    >
      {/* marka — POST bitince fosfor ateşlemesiyle parlar (aşırı-parlak → yerleşir) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: "brightness(1)" }}
        animate={
          showBrand
            ? {
                opacity: 1,
                scale: 1,
                filter: ["brightness(1)", "brightness(2.4)", "brightness(1)"],
              }
            : { opacity: 0, scale: 0.92, filter: "brightness(1)" }
        }
        transition={{
          duration: 0.55,
          ease: [0.16, 1, 0.3, 1],
          filter: { duration: 0.55, times: [0, 0.35, 1] },
        }}
        className="mb-8 flex flex-col items-center gap-3"
      >
        <span className="phosphor text-accent">
          <CathodeMark size={44} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Cathode
        </h1>
      </motion.div>

      {/* POST kolonu */}
      <div className="h-40 w-80 font-mono text-[11px] leading-relaxed text-text-dim">
        <div className="text-text">Cathode Systems 5100</div>
        <div className="mb-3 text-faint">phosphor bios v2.0</div>

        {mem !== null && (
          <div className="flex justify-between tabular-nums">
            <span>
              memory test: {mem} K{memDone ? "" : " …"}
            </span>
            {memDone && <span className="text-accent">ok</span>}
          </div>
        )}

        {PROBES.slice(0, probeStep).map((l) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {l}
          </motion.div>
        ))}

        {/* blink cursor */}
        <span
          className="mt-1 inline-block h-3.5 w-2 bg-text-dim align-middle"
          style={{ animation: "boot-blink 1s steps(1) infinite" }}
          aria-hidden
        />
        <style>{`@keyframes boot-blink { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }`}</style>
      </div>

      {/* ilerleme çizgisi */}
      <div className="mt-2 h-px w-80 overflow-hidden bg-border-soft">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: 2.3,
            ease: "easeInOut",
            delay: POWERON_MS / 1000,
          }}
        />
      </div>

      <span className="mt-6 font-mono text-[10px] tracking-widest text-faint">
        {t("boot.skip")}
      </span>

      {/* CRT tüp ısınması — üst/alt perde flicker'la açılır, altındaki BIOS
          içeriği zaten render olmuştur, perde çekilince ortaya çıkar. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 origin-top bg-void"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 1, 0.82, 1, 0] }}
        transition={{ duration: POWERON_MS / 1000, times: [0, 0.12, 0.3, 0.45, 1], ease: "easeIn" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-void"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 1, 0.82, 1, 0] }}
        transition={{ duration: POWERON_MS / 1000, times: [0, 0.12, 0.3, 0.45, 1], ease: "easeIn" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--accent)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.05, 0.2, 0] }}
        transition={{ duration: POWERON_MS / 1000, times: [0, 0.1, 0.2, 0.3, 0.6] }}
      />
    </motion.div>
  );
}
