"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
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

/**
 * Boot v2 — gerçek donanım POST sekansı (~2.4s, tıkla atla).
 * BIOS başlığı → bellek sayacı → cihaz probe → marka bloom → masaüstü.
 */
export function BootScreen({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
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
      }, 150),
    );

    // cihaz probe satırları
    PROBES.forEach((_, i) => {
      timers.push(setTimeout(() => setProbeStep(i + 1), 760 + i * 240));
    });

    // marka bloom + bitiş
    timers.push(setTimeout(() => setShowBrand(true), 1500));
    timers.push(setTimeout(onDone, 2450));

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
      aria-label="açılışı atla"
      className="fixed inset-0 z-[8000] flex cursor-pointer flex-col items-center justify-center bg-void"
    >
      {/* marka — POST bitince fosforla parlar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={
          showBrand ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }
        }
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ duration: 2.3, ease: "easeInOut" }}
        />
      </div>

      <span className="mt-6 font-mono text-[10px] tracking-widest text-faint">
        atlamak için tıkla
      </span>
    </motion.div>
  );
}
