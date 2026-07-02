"use client";

import dynamic from "next/dynamic";
import type { GameDefinition } from "@/data/games";
import { CathodeMark } from "@/components/icons";

// js-dos runtime ağırdır — yalnız bir oyun açılınca yüklenir.
const JsDos = dynamic(
  () => import("./JsDosScreen").then((m) => m.JsDosScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-black">
        <span className="phosphor animate-pulse text-accent">
          <CathodeMark size={28} />
        </span>
      </div>
    ),
  },
);

export function LazyJsDos(props: { game: GameDefinition; override?: string }) {
  return <JsDos {...props} />;
}
