"use client";

import { useEffect, useRef, useState } from "react";
import type { GameDefinition } from "@/data/games";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";

// js-dos v8 global (npm paketi tip/ESM sağlamaz — global script ile yüklenir).
type DosProps = { stop: () => Promise<void> };
type DosFn = (
  el: HTMLElement,
  opts: Record<string, unknown>,
) => DosProps;
declare global {
  interface Window {
    Dos?: DosFn;
  }
}

const SCRIPT_SRC = "/jsdos/js-dos.js";
const CSS_HREF = "/jsdos/js-dos.css";
const PATH_PREFIX = "/jsdos/emulators/";

let scriptPromise: Promise<void> | null = null;

/** js-dos runtime'ı bir kez yükle (script + css). */
function loadJsDos(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Dos) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_HREF;
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("emulator.jsdosLoadFailed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  game: GameDefinition;
  /** BYOG: kullanıcının yüklediği .jsdos/.zip için blob URL */
  override?: string;
}

export function JsDosScreen({ game, override }: Props) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let props: DosProps | null = null;
    let cancelled = false;

    (async () => {
      try {
        await loadJsDos();
        if (cancelled || !ref.current || !window.Dos) return;
        props = window.Dos(ref.current, {
          url: override ?? game.bundle.url,
          pathPrefix: PATH_PREFIX,
          backend: "dosboxX",
          noCloud: true, // bulut/sosyal kapalı — privacy-first
          autoStart: true,
          onEvent: (event: string) => {
            if (event === "ci-ready" || event === "emu-ready")
              setPhase("ready");
          },
        });
        // bazı sürümler event vermez; kısa gecikme ile hazır say
        setTimeout(() => !cancelled && setPhase((p) => (p === "loading" ? "ready" : p)), 1500);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "emulator.error");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      void props?.stop();
    };
  }, [game, override]);

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={ref} className="h-full w-full" />
      {phase !== "ready" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/85">
          {phase === "error" ? (
            <>
              <span className="text-danger">
                <Icon name="close" size={26} />
              </span>
              <p className="text-sm text-text">{error ? t(error) : ""}</p>
            </>
          ) : (
            <>
              <span className="phosphor animate-pulse text-accent">
                <Icon name="gamepad" size={30} />
              </span>
              <p className="font-mono text-xs text-text-dim">
                {t("emulator.dosboxStarting")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
