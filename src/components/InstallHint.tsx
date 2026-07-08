"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { registerServiceWorker } from "@/lib/pwa";
import { useT } from "@/lib/i18n/useT";
import { RetrogradeMark, Icon } from "@/components/icons";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const DISMISS_KEY = "retrograde.installHint.dismissed";

/** SW kaydı + nazik "uygulama olarak kur" ipucu (kapatılabilir, kalıcı). */
export function InstallHint() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const t = useT();

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
          className="fixed left-1/2 top-10 z-[6000] flex max-w-xs -translate-x-1/2 items-center gap-3 rounded-ui bg-surface-2 px-4 py-3 shadow-float"
        >
          <span className="phosphor text-accent" aria-hidden>
            <RetrogradeMark size={22} />
          </span>
          <div className="flex-1">
            <p className="text-[13px] text-text">{t("installHint.title")}</p>
            <p className="text-[11px] text-text-dim">
              {t("installHint.subtitle")}
            </p>
          </div>
          <button
            onClick={install}
            className="rounded-btn bg-accent px-2.5 py-1 text-xs font-medium text-accent-ink"
          >
            {t("installHint.install")}
          </button>
          <button
            onClick={dismiss}
            aria-label={t("common.close")}
            className="text-text-dim hover:text-text"
          >
            <Icon name="close" size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
