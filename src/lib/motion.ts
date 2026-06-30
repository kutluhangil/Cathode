"use client";

import { useEffect, useState } from "react";
import type { Transition, Variants } from "framer-motion";
import { useSettings } from "@/store/settingsStore";

/** Sistem prefers-reduced-motion değerini izler. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Hareket etkin mi: kullanıcı ayarı AND sistem tercihi. */
export function useMotionEnabled(): boolean {
  const motion = useSettings((s) => s.motion);
  const reduced = usePrefersReducedMotion();
  return motion && !reduced;
}

export const softSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const easeOut: Transition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1],
};

/** Pencere aç/kapa — hafif scale + fade (spec §4 hareket). */
export const windowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.16 } },
};

/** Sahneli giriş (boot sonrası masaüstü öğeleri). */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: easeOut },
};
