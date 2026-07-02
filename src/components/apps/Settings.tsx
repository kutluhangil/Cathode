"use client";

import { useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { Toggle } from "@/components/ui/Toggle";
import { Segmented } from "@/components/ui/Segmented";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import { BOOT_KEY } from "@/lib/layout";
import type { WallpaperId } from "@/lib/types";

/** Ayar kategorileri — gerçek OS ayar paneli düzeni (sol sidebar). */
type Category = "gorunum" | "efektler" | "duvar" | "sistem";

const CATS: { id: Category; icon: IconName; label: string }[] = [
  { id: "gorunum", icon: "palette", label: "görünüm" },
  { id: "efektler", icon: "crt", label: "efektler" },
  { id: "duvar", icon: "image", label: "duvar kâğıdı" },
  { id: "sistem", icon: "system", label: "sistem" },
];

const WALLPAPERS: { value: WallpaperId; label: string }[] = [
  { value: "phosphor", label: "Phosphor" },
  { value: "blueprint", label: "Blueprint" },
  { value: "testcard", label: "Test kartı" },
  { value: "void", label: "Void" },
  { value: "photo", label: "Foto" },
];

export function Settings() {
  const [cat, setCat] = useState<Category>("gorunum");
  const s = useSettings();

  return (
    <div className="flex h-full">
      {/* sidebar */}
      <nav className="flex w-[148px] shrink-0 flex-col gap-0.5 border-r border-border-soft bg-surface-0 p-2">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            aria-current={cat === c.id}
            className={cn(
              "flex items-center gap-2.5 rounded-btn px-2.5 py-2 text-left font-mono text-[12px] transition-colors",
              cat === c.id
                ? "bg-surface-3 text-text"
                : "text-text-dim hover:bg-surface-2 hover:text-text",
            )}
          >
            <span className={cat === c.id ? "text-accent" : "text-faint"}>
              <Icon name={c.icon} size={14} />
            </span>
            {c.label}
          </button>
        ))}
        <p className="mt-auto px-2.5 pb-1 font-mono text-[10px] leading-snug text-faint">
          ayarlar tarayıcında saklanır · sunucu yok
        </p>
      </nav>

      {/* içerik */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {cat === "gorunum" && (
          <>
            <PanelTitle>Görünüm</PanelTitle>
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
            <Row title="Hareket" hint="Pencere ve arayüz animasyonları.">
              <Toggle checked={s.motion} onChange={s.setMotion} label="hareket" />
            </Row>
          </>
        )}

        {cat === "efektler" && (
          <>
            <PanelTitle>Efektler</PanelTitle>
            <Row
              title="CRT efektleri"
              hint="Aperture grille, vinyet, grain ve fosfor parıltı."
            >
              <Toggle checked={s.crt} onChange={s.setCrt} label="CRT efektleri" />
            </Row>
            <Row
              title="Monitör modu"
              hint={"Fiziksel \"Cathode 5100\" çerçevesi — bezel + güç LED'i."}
            >
              <Toggle
                checked={s.monitor}
                onChange={s.setMonitor}
                label="monitör modu"
              />
            </Row>
            <Row
              title="Ekran koruyucu"
              hint="3 dk hareketsizlikte fosfor koruyucu."
            >
              <Toggle
                checked={s.screensaver}
                onChange={s.setScreensaver}
                label="ekran koruyucu"
              />
            </Row>
            <Row title="Arayüz sesleri" hint="Aç/kapa tıkları (varsayılan kapalı).">
              <Toggle checked={s.sound} onChange={s.setSound} label="sesler" />
            </Row>
          </>
        )}

        {cat === "duvar" && (
          <>
            <PanelTitle>Duvar kâğıdı</PanelTitle>
            <div className="grid grid-cols-2 gap-2.5 py-3">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => s.setWallpaper(w.value)}
                  aria-pressed={s.wallpaper === w.value}
                  className={cn(
                    "group overflow-hidden rounded-ui border text-left transition-colors",
                    s.wallpaper === w.value
                      ? "border-accent"
                      : "border-border-soft hover:border-border",
                  )}
                >
                  <WallpaperThumb id={w.value} />
                  <span
                    className={cn(
                      "block px-2.5 py-1.5 text-xs",
                      s.wallpaper === w.value ? "text-text" : "text-text-dim",
                    )}
                  >
                    {w.label}
                  </span>
                </button>
              ))}
            </div>
            {s.wallpaper === "photo" && (
              <Row title="Fotoğrafı yenile" hint="Yeni rastgele 4K görsel çek.">
                <button
                  onClick={s.shufflePhoto}
                  className="flex items-center gap-1.5 rounded-btn border border-border-soft bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-accent hover:text-text"
                >
                  <Icon name="refresh" size={12} /> yenile
                </button>
              </Row>
            )}
          </>
        )}

        {cat === "sistem" && (
          <>
            <PanelTitle>Sistem</PanelTitle>
            <div className="space-y-1.5 py-3 font-mono text-[12px]">
              <KV k="kabuk" v="cathode workstation v2" />
              <KV k="render" v="phosphor crt" />
              <KV k="emülasyon" v="v86 · js-dos (wasm)" />
              <KV k="veri" v="localStorage · OPFS — sunucu yok" />
            </div>
            <Row
              title="Yeniden başlat"
              hint="Boot sekansını tekrar oynatır."
            >
              <button
                onClick={() => {
                  sessionStorage.removeItem(BOOT_KEY);
                  location.reload();
                }}
                className="flex items-center gap-1.5 rounded-btn border border-border-soft bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-accent hover:text-text"
              >
                <Icon name="power" size={12} /> yeniden başlat
              </button>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="phosphor border-b border-border-soft pb-3 pt-1 text-base font-semibold tracking-tight text-text">
      {children}
    </h2>
  );
}

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

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-soft/60 pb-1.5">
      <span className="text-faint">{k}</span>
      <span className="text-text-dim">{v}</span>
    </div>
  );
}

/** Kategori önizlemeleri — duvar kâğıdı stillerinin minyatürleri. */
function WallpaperThumb({ id }: { id: WallpaperId }) {
  return (
    <span className="relative block h-14 w-full overflow-hidden bg-[#0a0a0d]">
      {id === "phosphor" && (
        <span
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 80% at 50% 50%, var(--accent) 0%, transparent 65%)",
            opacity: 0.35,
          }}
        />
      )}
      {id === "blueprint" && (
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
            opacity: 0.25,
          }}
        />
      )}
      {id === "testcard" && (
        <span className="absolute inset-0 flex">
          {[90, 65, 42, 24, 10].map((p) => (
            <span
              key={p}
              className="h-full flex-1"
              style={{
                background: `color-mix(in srgb, var(--accent) ${p}%, #050506)`,
              }}
            />
          ))}
        </span>
      )}
      {id === "void" && (
        <span
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 80% at 50% 40%, #14141a 0%, #050506 90%)",
          }}
        />
      )}
      {id === "photo" && (
        <span className="absolute inset-0 flex items-center justify-center text-faint">
          <Icon name="image" size={18} />
        </span>
      )}
    </span>
  );
}
