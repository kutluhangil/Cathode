"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";

interface Props {
  onDone: () => void;
}

const LOG = [
  "cathode bios v1.0",
  "obsidian core ......... ok",
  "phosphor display ...... ok",
  "window manager ........ ok",
  "mounting shell ........ ok",
];

export function BootScreen({ onDone }: Props) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }
    const lineTimers = LOG.map((_, i) =>
      setTimeout(() => setStep(i + 1), 350 + i * 320),
    );
    const done = setTimeout(onDone, 2300);
    return () => {
      lineTimers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [reduced, onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onDone}
      role="button"
      aria-label="açılışı atla"
      className="fixed inset-0 z-[8000] flex cursor-pointer flex-col items-center justify-center bg-void"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-4"
      >
        <motion.span
          className="phosphor text-5xl text-accent"
          animate={{ opacity: [0.5, 1, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          ◉
        </motion.span>
        <h1 className="text-3xl font-semibold tracking-tight text-text">
          Cathode
        </h1>
      </motion.div>

      {/* boot log */}
      <div className="mt-10 h-24 w-72 font-mono text-[11px] leading-relaxed text-text-dim">
        {LOG.slice(0, step).map((l) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-between"
          >
            <span>{l}</span>
          </motion.div>
        ))}
      </div>

      {/* ilerleme çizgisi */}
      <div className="mt-2 h-px w-72 overflow-hidden bg-border">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.1, ease: "easeInOut" }}
        />
      </div>

      <span className="mt-6 font-mono text-[10px] tracking-widest text-text-dim/60">
        atlamak için tıkla
      </span>
    </motion.div>
  );
}
