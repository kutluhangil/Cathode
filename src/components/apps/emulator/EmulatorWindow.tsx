"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { V86Engine, type EmuPhase } from "@/lib/emu/v86Engine";
import type { OsDefinition } from "@/data/os";
import { cn } from "@/lib/cn";
import { deleteState, hasState, readState, writeState } from "@/lib/persist";

interface Props {
  os: OsDefinition;
  /** BYOI: kullanıcının yüklediği imaj (yalnız client'ta, sunucuya gitmez) */
  override?: ArrayBuffer;
}

const HINTS: Record<string, string> = {
  downloading: "imaj indiriliyor…",
  booting: "sistem başlatılıyor…",
};

export function EmulatorWindow({ os, override }: Props) {
  const screenRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<V86Engine | null>(null);
  const [phase, setPhase] = useState<EmuPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState(false);
  const [sleeping, setSleeping] = useState(false);

  // OPFS anahtarı — BYOI dahil os.id bazlı
  const stateKey = `v86-${os.id}`;

  useEffect(() => {
    void hasState(stateKey).then(setSavedSession);
  }, [stateKey]);

  useEffect(() => {
    if (!screenRef.current) return;
    const engine = new V86Engine({
      onPhase: setPhase,
      onError: setError,
      onProgress: (loaded, total) =>
        setProgress(Math.round((loaded / total) * 100)),
    });
    engineRef.current = engine;
    engine.start(screenRef.current, os, override);
    return () => {
      void engine.destroy();
      engineRef.current = null;
    };
    // os.id / override değişince yeniden kur
  }, [os, override]);

  const reset = () => engineRef.current?.restart();

  const fullscreen = () => {
    screenRef.current?.requestFullscreen?.().catch(() => {});
  };

  const saveState = async () => {
    const state = await engineRef.current?.saveState();
    if (!state) return;
    const blob = new Blob([state], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${os.id}-state.bin`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // OPFS'e uyut: çalışan durumu kalıcı sakla ("uyku/devam" hissi)
  const sleep = async () => {
    setSleeping(true);
    const state = await engineRef.current?.saveState();
    if (state) {
      const ok = await writeState(stateKey, state);
      if (ok) setSavedSession(true);
    }
    setSleeping(false);
  };

  // kaydedilen oturumdan devam et
  const resume = useCallback(async () => {
    const state = await readState(stateKey);
    if (state) await engineRef.current?.restoreState(state);
  }, [stateKey]);

  const dropSession = async () => {
    await deleteState(stateKey);
    setSavedSession(false);
  };

  const loading = phase === "downloading" || phase === "booting";

  return (
    <div className="flex h-full flex-col bg-black">
      {/* kontrol çubuğu */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-soft bg-surface/80 px-3 py-1.5">
        <span className="font-mono text-[11px] text-accent">{os.glyph}</span>
        <span className="text-[12px] text-text">{os.name}</span>
        <span
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
          <Ctl onClick={reset}>sıfırla</Ctl>
          <Ctl onClick={sleep} disabled={phase !== "ready" || sleeping}>
            {sleeping ? "uyutuluyor…" : "uyut"}
          </Ctl>
          <Ctl onClick={saveState} disabled={phase !== "ready"}>
            indir
          </Ctl>
          <Ctl onClick={fullscreen}>tam ekran</Ctl>
        </div>
      </div>

      {/* ekran */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={screenRef}
          className="absolute inset-0 flex items-center justify-center bg-black"
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
                <span className="text-2xl text-[#ff5f56]">✕</span>
                <p className="text-sm text-text">{error ?? "hata"}</p>
                <Ctl onClick={() => location.reload()}>tekrar dene</Ctl>
              </>
            ) : (
              <>
                <span className="phosphor animate-pulse text-3xl text-accent">
                  {os.glyph}
                </span>
                <p className="font-mono text-xs text-text-dim">
                  {HINTS[phase] ?? "hazırlanıyor…"}
                </p>
                {phase === "downloading" && (
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

        {/* kayıtlı oturum — uykudan devam */}
        {phase === "ready" && savedSession && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-[10px] border border-accent/50 bg-void/85 px-3 py-2 backdrop-blur">
            <span className="font-mono text-[11px] text-text">
              kayıtlı oturum var
            </span>
            <Ctl onClick={resume}>devam et</Ctl>
            <Ctl onClick={dropSession}>sil</Ctl>
          </div>
        )}

        {/* ekranı bırak ipucu */}
        {phase === "ready" && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-void/70 px-3 py-1 font-mono text-[10px] text-text-dim">
            tıkla = fareyi yakala · Esc = ekranı bırak
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
