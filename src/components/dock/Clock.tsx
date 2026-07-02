"use client";

import { useEffect, useState } from "react";

function fmt(d: Date) {
  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d
    .toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
    .toLowerCase(); // sentence case kuralı — otomatik büyük harf yok
  return { time, date };
}

/** Tek satır sistem saati — SystemBar tray'inde yaşar. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="w-24" aria-hidden />;
  const { time, date } = fmt(now);

  return (
    <span className="px-1 font-mono text-[12px] tabular-nums text-text-dim">
      {time}
      <span className="text-faint"> · {date}</span>
    </span>
  );
}
