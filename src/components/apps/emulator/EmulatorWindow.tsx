"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { V86Engine, type EmuPhase } from "@/lib/emu/v86Engine";
import type { OsDefinition } from "@/data/os";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";
import {
  saveSession,
  resumeSession,
  hasSession,
  dropSession,
} from "@/lib/emu/emuSession";

interface Props {
  os: OsDefinition;
  /** BYOI: kullanıcının yüklediği imaj (yalnız client'ta, sunucuya gitmez) */
  override?: ArrayBuffer;
}

export function EmulatorWindow({ os, override }: Props) {
  const t = useT();
  const screenRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<V86Engine | null>(null);
  const [phase, setPhase] = useState<EmuPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  // OPFS anahtarı — BYOI dahil os.id bazlı
  const stateKey = `v86-${os.id}`;

  // otomatik uyku/devam koordinasyonu
  const reachedReadyRef = useRef(false);
  const willResumeRef = useRef(false);
  const resumedRef = useRef(false);

  // ready + kayıtlı oturum ikisi de hazır olunca bir kez geri yükle
  const maybeResume = useCallback(() => {
    if (
      !reachedReadyRef.current ||
      !willResumeRef.current ||
      resumedRef.current ||
      !engineRef.current
    )
      return;
    resumedRef.current = true;
    setResuming(true);
    void resumeSession(engineRef.current, stateKey).finally(() =>
      setResuming(false),
    );
  }, [stateKey]);

  // mount: kayıtlı oturum var mı?
  useEffect(() => {
    void hasSession(stateKey).then((v) => {
      willResumeRef.current = v;
      maybeResume();
    });
  }, [stateKey, maybeResume]);

  useEffect(() => {
    if (!screenRef.current) return;
    // Start bir tick geciktirilir: React StrictMode mount→cleanup→mount döngüsünde
    // aynı DOM container'da iki V86 örneğinin yarışmasını önler.
    let engine: V86Engine | null = null;
    const timer = setTimeout(() => {
      if (!screenRef.current) return;
      engine = new V86Engine({
        onPhase: (p) => {
          setPhase(p);
          if (p === "ready") {
            reachedReadyRef.current = true;
            maybeResume();
          }
        },
        onError: setError,
        onProgress: (loaded, total) =>
          setProgress(Math.round((loaded / total) * 100)),
      });
      engineRef.current = engine;
      engine.start(screenRef.current, os, override);
    }, 60);

    return () => {
      clearTimeout(timer);
      const e = engine;
      engineRef.current = null;
      // otomatik uyku: kapat/küçült öncesi durumu kaydet, sonra yok et
      void (async () => {
        try {
          if (e && reachedReadyRef.current) {
            await saveSession(e, stateKey);
          }
        } catch {
          /* teardown best-effort — kayıt başarısız olsa da yıkımı engelleme */
        }
        await e?.destroy();
      })();
    };
    // os.id / override değişince yeniden kur
  }, [os, override, stateKey, maybeResume]);

  const reset = () => engineRef.current?.restart();

  const newSession = async () => {
    willResumeRef.current = false;
    resumedRef.current = true; // yeni oturumda tekrar resume etme
    await dropSession(stateKey);
    engineRef.current?.restart();
  };

  const fullscreen = () => {
    screenRef.current?.requestFullscreen?.().catch(() => {});
  };

  const download = async () => {
    const state = await engineRef.current?.saveState();
    if (!state) return;
    const blob = new Blob([state], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${os.id}-state.bin`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loading = phase === "downloading" || phase === "booting" || resuming;

  return (
    <div className="flex h-full flex-col bg-black">
      {/* kontrol çubuğu */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-soft bg-surface/80 px-3 py-1.5">
        <span className="font-mono text-[11px] text-accent">{os.glyph}</span>
        <span className="text-[12px] text-text">{os.name}</span>
        <span
          data-testid="emu-status"
          data-phase={phase}
          className={cn(
            "ml-1 h-1.5 w-1.5 rounded-full",
            phase === "ready"
              ? "bg-accent"
              : phase === "error"
                ? "bg-[#ff5f56]"
                : "bg-text-dim",
          )}
        />
        <div className="ml-auto flex items-center gap-1">
          <Ctl onClick={reset}>{t("emulator.reset")}</Ctl>
          <Ctl onClick={newSession} disabled={phase !== "ready"}>
            {t("emulator.newSession")}
          </Ctl>
          <Ctl onClick={download} disabled={phase !== "ready"}>
            {t("emulator.download")}
          </Ctl>
          <Ctl onClick={fullscreen}>{t("emulator.fullscreen")}</Ctl>
        </div>
      </div>

      {/* ekran */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={screenRef}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black",
            phase === "ready" && !resuming && "cursor-none",
          )}
        >
          {/* v86 yapısı: metin modu div + grafik canvas */}
          <div
            style={{
              whiteSpace: "pre",
              font: "14px monospace",
              lineHeight: "14px",
              color: "#fff",
            }}
          />
          <canvas style={{ display: "none" }} />
        </div>

        {/* yükleme / hata kaplaması */}
        {(loading || phase === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/90 backdrop-blur">
            {phase === "error" ? (
              <>
                <span className="text-danger">
                  <Icon name="close" size={26} />
                </span>
                <p className="text-sm text-text">
                  {error ? t(error) : t("emulator.error")}
                </p>
                <Ctl onClick={() => location.reload()}>{t("common.retry")}</Ctl>
              </>
            ) : (
              <>
                <span className="phosphor animate-pulse text-accent">
                  <Icon name="disk" size={30} />
                </span>
                <p className="font-mono text-xs text-text-dim">
                  {resuming
                    ? t("emulator.resuming")
                    : phase === "downloading"
                      ? t("emulator.hintDownloading")
                      : phase === "booting"
                        ? t("emulator.hintBooting")
                        : t("emulator.preparing")}
                </p>
                {phase === "downloading" && !resuming && (
                  <div className="h-px w-48 overflow-hidden bg-border">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ekranı bırak ipucu */}
        {phase === "ready" && !resuming && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-void/70 px-3 py-1 font-mono text-[10px] text-text-dim">
            {t("emulator.captureHint")}
          </div>
        )}
      </div>
    </div>
  );
}

function Ctl({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-[6px] border border-border px-2 py-1 font-mono text-[10px] text-text-dim transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-dim"
    >
      {children}
    </button>
  );
}
