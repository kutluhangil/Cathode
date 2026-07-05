"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Odak tuzağı: pencere mount olunca kabına odaklanır; aktifken Tab pencere
 * içinde döner (Shift+Tab geri). Emülatör pencereleri kendi klavyesini yönetir.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  // mount: kaba odaklan (app içeriğiyle kavga etmesin diye ilk odak kap)
  useEffect(() => {
    ref.current?.focus();
  }, [ref]);

  // aktifken Tab döngüsü
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(
        el.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (activeEl === first || activeEl === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [ref, active]);
}
