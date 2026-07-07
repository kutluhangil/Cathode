"use client";

import { useEffect, useRef } from "react";

const SEQ = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/** Konami kodu (↑↑↓↓←→←→ b a) tamamlanınca onTrigger'ı çağırır. */
export function useKonami(onTrigger: () => void) {
  const idx = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === SEQ[idx.current]) {
        idx.current += 1;
        if (idx.current === SEQ.length) {
          idx.current = 0;
          onTrigger();
        }
      } else {
        idx.current = k === SEQ[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTrigger]);
}
