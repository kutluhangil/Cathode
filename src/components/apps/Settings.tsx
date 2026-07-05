"use client";

import { useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useUiStore } from "@/store/uiStore";
import { useT } from "@/lib/i18n/useT";
import type { Lang } from "@/lib/i18n/types";
import { Toggle } from "@/components/ui/Toggle";
import { Segmented } from "@/components/ui/Segmented";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";
import { BOOT_KEY } from "@/lib/layout";
import type { WallpaperId } from "@/lib/types";
import { GALLERY_PHOTOS } from "@/data/wallpapers";

/** Ayar kategorileri — gerçek OS ayar paneli düzeni (sol sidebar). */
type Category = "gorunum" | "efektler" | "duvar" | "sistem";

const CATS: { id: Category; icon: IconName; labelKey: string }[] = [
  { id: "gorunum", icon: "palette", labelKey: "settings.catAppearance" },
  { id: "efektler", icon: "crt", labelKey: "settings.catEffects" },
  { id: "duvar", icon: "image", labelKey: "settings.catWallpaper" },
  { id: "sistem", icon: "system", labelKey: "settings.catSystem" },
];

const WALLPAPERS: { value: WallpaperId; labelKey: string }[] = [
  { value: "phosphor", labelKey: "settings.wpPhosphor" },
  { value: "blueprint", labelKey: "settings.wpBlueprint" },
  { value: "testcard", labelKey: "settings.wpTestcard" },
  { value: "void", labelKey: "settings.wpVoid" },
  { value: "photo", labelKey: "settings.wpPhoto" },
];

export function Settings() {
  const [cat, setCat] = useState<Category>("gorunum");
  const s = useSettings();
  const t = useT();

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
            {t(c.labelKey)}
          </button>
        ))}
        <p className="mt-auto px-2.5 pb-1 font-mono text-[10px] leading-snug text-faint">
          {t("settings.storedNote")}
        </p>
      </nav>

      {/* içerik */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {cat === "gorunum" && (
          <>
            <PanelTitle>{t("settings.appearance")}</PanelTitle>
            <Row title={t("settings.language")}>
              <Segmented
                ariaLabel={t("settings.language")}
                value={s.lang}
                onChange={(v) => s.setLang(v as Lang)}
                options={[
                  { value: "tr", label: t("settings.languageTr") },
                  { value: "en", label: t("settings.languageEn") },
                ]}
              />
            </Row>
            <Row title={t("settings.accent")} hint={t("settings.accentHint")}>
              <Segmented
                ariaLabel={t("settings.accent")}
                value={s.accent}
                onChange={s.setAccent}
                options={[
                  { value: "amber", label: t("settings.accentAmber") },
                  { value: "green", label: t("settings.accentGreen") },
                ]}
              />
            </Row>
            <Row title={t("settings.motion")} hint={t("settings.motionHint")}>
              <Toggle
                checked={s.motion}
                onChange={s.setMotion}
                label={t("settings.motionLabel")}
              />
            </Row>
          </>
        )}

        {cat === "efektler" && (
          <>
            <PanelTitle>{t("settings.effects")}</PanelTitle>
            <Row title={t("settings.crt")} hint={t("settings.crtHint")}>
              <Toggle
                checked={s.crt}
                onChange={s.setCrt}
                label={t("settings.crt")}
              />
            </Row>
            <Row title={t("settings.monitor")} hint={t("settings.monitorHint")}>
              <Toggle
                checked={s.monitor}
                onChange={s.setMonitor}
                label={t("settings.monitorLabel")}
              />
            </Row>
            <Row title={t("settings.sound")} hint={t("settings.soundHint")}>
              <Toggle
                checked={s.sound}
                onChange={s.setSound}
                label={t("settings.soundLabel")}
              />
            </Row>

            {/* Ekran koruyucu — Windows'daki "Screen Saver Settings" düzeni:
                mini canlı önizleme + tür + bekleme süresi + Önizle düğmesi. */}
            <div className="border-b border-border-soft py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-text">
                    {t("settings.screensaver")}
                  </div>
                  <div className="mt-0.5 text-xs text-text-dim">
                    {t("settings.screensaverHint")}
                  </div>
                </div>
                <Toggle
                  checked={s.screensaver}
                  onChange={s.setScreensaver}
                  label={t("settings.screensaverLabel")}
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ScreensaverMiniPreview />
                <div className="flex flex-1 items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-text-dim">
                    {t("settings.screensaverType")}
                  </span>
                  <PreviewButton />
                </div>
              </div>
            </div>
          </>
        )}

        {cat === "duvar" && (
          <>
            <PanelTitle>{t("settings.wallpaper")}</PanelTitle>

            <p className="pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
              {t("settings.wpAbstract")}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pb-3">
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
                    {t(w.labelKey)}
                  </span>
                </button>
              ))}
            </div>
            {s.wallpaper === "photo" && (
              <Row
                title={t("settings.wpRefresh")}
                hint={t("settings.wpRefreshHint")}
              >
                <button
                  onClick={s.shufflePhoto}
                  className="flex items-center gap-1.5 rounded-btn border border-border-soft bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-accent hover:text-text"
                >
                  <Icon name="refresh" size={12} /> {t("settings.refresh")}
                </button>
              </Row>
            )}

            <p className="pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-faint">
              {t("settings.wpPhotoGroup")}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pb-3">
              {GALLERY_PHOTOS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => s.setWallpaper(p.id)}
                  aria-pressed={s.wallpaper === p.id}
                  className={cn(
                    "group overflow-hidden rounded-ui border text-left transition-colors",
                    s.wallpaper === p.id
                      ? "border-accent"
                      : "border-border-soft hover:border-border",
                  )}
                >
                  <span className="relative block h-14 w-full overflow-hidden bg-[#0a0a0d]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumb}
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </span>
                  <span
                    className={cn(
                      "block px-2.5 py-1.5 text-xs",
                      s.wallpaper === p.id ? "text-text" : "text-text-dim",
                    )}
                  >
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {cat === "sistem" && (
          <>
            <PanelTitle>{t("settings.system")}</PanelTitle>
            <div className="space-y-1.5 py-3 font-mono text-[12px]">
              <KV k={t("settings.sysShell")} v="cathode workstation v2" />
              <KV k={t("settings.sysRender")} v="phosphor crt" />
              <KV k={t("settings.sysEmu")} v="v86 · js-dos (wasm)" />
              <KV k={t("settings.sysData")} v={t("settings.sysDataValue")} />
            </div>
            <Row
              title={t("settings.reboot")}
              hint={t("settings.rebootHint")}
            >
              <button
                onClick={() => {
                  sessionStorage.removeItem(BOOT_KEY);
                  location.reload();
                }}
                className="flex items-center gap-1.5 rounded-btn border border-border-soft bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-accent hover:text-text"
              >
                <Icon name="power" size={12} /> {t("settings.rebootBtn")}
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

/** Windows'daki ekran koruyucu ayarlarındaki küçük "monitör" önizlemesi. */
function ScreensaverMiniPreview() {
  return (
    <span className="relative block h-12 w-20 shrink-0 overflow-hidden rounded-[3px] border border-border-soft bg-[#030304]">
      <span
        className="aerial-blob-mini-1 absolute left-[10%] top-[15%] h-[60%] w-[60%] rounded-full blur-[16px]"
        style={{ background: "var(--accent)", opacity: 0.5 }}
      />
      <span
        className="aerial-blob-mini-2 absolute right-[5%] top-[5%] h-[50%] w-[50%] rounded-full blur-[14px]"
        style={{
          background: "color-mix(in srgb, var(--accent) 30%, #2b6cff 70%)",
          opacity: 0.45,
        }}
      />
    </span>
  );
}

/** Windows'daki "Preview" düğmesi — idle beklemeden ekran koruyucuyu tetikler. */
function PreviewButton() {
  const preview = useUiStore((s) => s.previewScreensaver);
  const t = useT();
  return (
    <button
      onClick={preview}
      className="flex shrink-0 items-center gap-1.5 rounded-btn border border-border-soft bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-dim transition-colors hover:border-accent hover:text-text"
    >
      <Icon name="refresh" size={12} /> {t("settings.previewNow")}
    </button>
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
