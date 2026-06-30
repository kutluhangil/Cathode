"use client";

import { useEffect, useState } from "react";

function fmt(d: Date) {
  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
  return { time, date };
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="w-14" aria-hidden />;
  const { time, date } = fmt(now);

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="font-mono text-[13px] tabular-nums text-text">
        {time}
      </span>
      <span className="font-mono text-[10px] text-text-dim">{date}</span>
    </div>
  );
}
