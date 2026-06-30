"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BootScreen } from "@/components/boot/BootScreen";
import { Desktop } from "@/components/desktop/Desktop";

const BOOT_KEY = "cathode.booted";

export default function Page() {
  // boot oturum başına bir kez (sessionStorage)
  const [booting, setBooting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(BOOT_KEY);
    setBooting(!seen);
    setReady(true);
  }, []);

  const finishBoot = () => {
    sessionStorage.setItem(BOOT_KEY, "1");
    setBooting(false);
  };

  if (!ready) return <div className="h-screen w-screen bg-void" />;

  return (
    <ThemeProvider>
      <Desktop />
      <AnimatePresence>
        {booting && <BootScreen onDone={finishBoot} />}
      </AnimatePresence>
    </ThemeProvider>
  );
}
