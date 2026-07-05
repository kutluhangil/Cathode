"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/store/settingsStore";

function fmt(d: Date, locale: string) {
  const time = d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d
    .toLocaleDateString(locale, { day: "2-digit", month: "short" })
    .toLowerCase(); // sentence case kuralı — otomatik büyük harf yok
  return { time, date };
}

/** Tek satır sistem saati — SystemBar tray'inde yaşar. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  const lang = useSettings((s) => s.lang);
  const locale = lang === "tr" ? "tr-TR" : "en-US";

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="w-24" aria-hidden />;
  const { time, date } = fmt(now, locale);

  return (
    <span className="px-1 font-mono text-[12px] tabular-nums text-text-dim">
      {time}
      <span className="text-faint"> · {date}</span>
    </span>
  );
}
