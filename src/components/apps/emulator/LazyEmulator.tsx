"use client";

import dynamic from "next/dynamic";
import type { OsDefinition } from "@/data/os";

// v86 ağırdır — yalnız bir OS penceresi açılınca yüklenir (spec §3 perf).
const Emulator = dynamic(
  () => import("./EmulatorWindow").then((m) => m.EmulatorWindow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-black">
        <span className="phosphor animate-pulse text-2xl text-accent">◉</span>
      </div>
    ),
  },
);

export function LazyEmulator(props: {
  os: OsDefinition;
  override?: ArrayBuffer;
}) {
  return <Emulator {...props} />;
}
