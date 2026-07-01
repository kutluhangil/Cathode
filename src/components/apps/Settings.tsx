"use client";

import { useSettings } from "@/store/settingsStore";
import { Toggle } from "@/components/ui/Toggle";
import { Segmented } from "@/components/ui/Segmented";
import type { WallpaperId } from "@/lib/types";

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-4">
      <div>
        <div className="text-sm text-text">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-text-dim">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const WALLPAPERS: { value: WallpaperId; label: string }[] = [
  { value: "horizon", label: "Horizon" },
  { value: "aurora", label: "Aurora" },
  { value: "grid", label: "Grid" },
  { value: "monolith", label: "Monolith" },
];

export function Settings() {
  const s = useSettings();

  return (
    <div className="h-full overflow-y-auto px-6 py-2">
      <h2 className="phosphor py-4 text-lg font-semibold tracking-tight text-text">
        Ayarlar
      </h2>

      <Row title="Accent" hint="Fosfor rengi — amber ya da yeşil.">
        <Segmented
          ariaLabel="accent rengi"
          value={s.accent}
          onChange={s.setAccent}
          options={[
            { value: "amber", label: "Amber" },
            { value: "green", label: "Yeşil" },
          ]}
        />
      </Row>

      <Row title="CRT efektleri" hint="Scanline, vignette, grain ve fosfor parıltı.">
        <Toggle checked={s.crt} onChange={s.setCrt} label="CRT efektleri" />
      </Row>

      <Row title="Hareket" hint="Pencere ve arayüz animasyonları.">
        <Toggle checked={s.motion} onChange={s.setMotion} label="hareket" />
      </Row>

      <Row title="Duvar kâğıdı" hint="Masaüstü arka planı.">
        <Segmented
          ariaLabel="duvar kâğıdı"
          value={s.wallpaper}
          onChange={s.setWallpaper}
          options={WALLPAPERS}
        />
      </Row>

      <Row title="Arayüz sesleri" hint="Aç/kapa tıkları (varsayılan kapalı).">
        <Toggle checked={s.sound} onChange={s.setSound} label="sesler" />
      </Row>

      <p className="py-4 font-mono text-[11px] text-text-dim/70">
        ayarlar tarayıcında saklanır · sunucu yok
      </p>
    </div>
  );
}
