"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BootScreen } from "@/components/boot/BootScreen";
import { Desktop } from "@/components/desktop/Desktop";
import { useMotionEnabled } from "@/lib/motion";
import { BOOT_KEY } from "@/lib/layout";

export default function Page() {
  // boot oturum başına bir kez (sessionStorage)
  const [booting, setBooting] = useState(false);
  const [ready, setReady] = useState(false);
  // boot'tan yeni çıkıldıysa masaüstü CRT "açılma" animasyonuyla gelir
  const [justBooted, setJustBooted] = useState(false);
  const motionOn = useMotionEnabled();

  useEffect(() => {
    const seen = sessionStorage.getItem(BOOT_KEY);
    setBooting(!seen);
    setReady(true);
  }, []);

  const finishBoot = () => {
    sessionStorage.setItem(BOOT_KEY, "1");
    setBooting(false);
    setJustBooted(true);
  };

  if (!ready) return <div className="h-screen w-screen bg-void" />;

  const crtOn = justBooted && motionOn;

  return (
    <ThemeProvider>
      {/* CRT açılışı: yatay çizgiden ekrana bloom (yalnız boot sonrası + motion açıkken) */}
      <motion.div
        initial={
          crtOn
            ? { scaleY: 0.005, opacity: 0.4, filter: "brightness(2.6)" }
            : false
        }
        animate={{ scaleY: 1, opacity: 1, filter: "brightness(1)" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="h-full w-full origin-center"
      >
        <Desktop />
      </motion.div>
      <AnimatePresence>
        {booting && <BootScreen onDone={finishBoot} />}
      </AnimatePresence>
    </ThemeProvider>
  );
}
