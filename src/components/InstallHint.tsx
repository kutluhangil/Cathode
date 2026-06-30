"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { registerServiceWorker } from "@/lib/pwa";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const DISMISS_KEY = "cathode.installHint.dismissed";

/** SW kaydı + nazik "uygulama olarak kur" ipucu (kapatılabilir, kalıcı). */
export function InstallHint() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    if (localStorage.getItem(DISMISS_KEY)) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 top-4 z-[6000] flex max-w-xs -translate-x-1/2 items-center gap-3 rounded-[12px] border border-border bg-glass px-4 py-3 shadow-win"
        >
          <span className="phosphor text-lg text-accent" aria-hidden>
            ◉
          </span>
          <div className="flex-1">
            <p className="text-[13px] text-text">
              {"Cathode'u uygulama olarak kur"}
            </p>
            <p className="text-[11px] text-text-dim">masaüstünden tek tıkla aç</p>
          </div>
          <button
            onClick={install}
            className="rounded-[8px] bg-accent px-2.5 py-1 text-xs font-medium text-accent-ink"
          >
            Kur
          </button>
          <button
            onClick={dismiss}
            aria-label="kapat"
            className="text-text-dim hover:text-text"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
