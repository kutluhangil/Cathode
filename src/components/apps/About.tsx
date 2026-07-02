"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CathodeMark } from "@/components/icons";

const COPY = {
  tr: {
    tagline: "Tarayıcıda çalışan, özgün tasarımlı retro işletim sistemi.",
    body: "Cathode iki katmanlı bir projedir. Dışarıda tamamen bize ait, özgün tasarımlı bir işletim sistemi kabuğu vardır. İçeride ise gerçek eski işletim sistemleri bir pencere içinde, tarayıcıda izole çalışacaktır. Her şey senin tarayıcında çalışır; sunucuda işletim sistemi koşmaz.",
    discTitle: "Yasal not",
    disclaimer:
      "Cathode bir hobi/eğitim/dijital koruma projesidir. Emülasyon motorları açık kaynaktır. Eski işletim sistemleri telif sahiplerine aittir ve yalnızca arşiv/nostalji amacıyla, tarayıcıda izole biçimde çalıştırılır. Telif sahibi talep ederse ilgili içerik kaldırılır. Bu site reklam içermez, ticari amaç gütmez.",
  },
  en: {
    tagline: "A browser-native retro operating system with an original design.",
    body: "Cathode is a two-layer project. On the outside is an entirely original operating-system shell that is our own brand. On the inside, real legacy operating systems will run inside a window, isolated in your browser. Everything runs in your browser; no OS runs on a server.",
    discTitle: "Legal notice",
    disclaimer:
      "Cathode is a hobby/education/digital-preservation project. The emulation engines are open source. Legacy operating systems belong to their copyright holders and are run only for archival/nostalgia purposes, isolated inside the browser. Content is removed on a rights holder's request. This site has no ads and no commercial intent.",
  },
} as const;

/** Spec-sheet satırları — donanım künyesi hissi (dil bağımsız, mono). */
const SPECS: [string, string][] = [
  ["shell", "cathode workstation v2"],
  ["render", "phosphor crt"],
  ["emulation", "v86 · js-dos (wasm)"],
  ["data", "localStorage · OPFS — no server"],
];

export function About() {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const t = COPY[lang];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="phosphor mt-1 text-accent">
            <CathodeMark size={30} />
          </span>
          <div>
            <h2 className="phosphor text-2xl font-semibold tracking-tight text-text">
              Cathode
            </h2>
            <p className="mt-1 max-w-sm text-sm text-text-dim">{t.tagline}</p>
          </div>
        </div>
        <div className="flex overflow-hidden rounded-btn border border-border-soft text-xs">
          {(["tr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-2.5 py-1 uppercase transition-colors",
                lang === l
                  ? "bg-accent text-accent-ink"
                  : "text-text-dim hover:text-text",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* donanım künyesi — spec sheet */}
      <div className="mb-5 rounded-ui border border-border-soft bg-surface-0 px-4 py-3 font-mono text-[12px]">
        {SPECS.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-border-soft/60 py-1.5 last:border-b-0"
          >
            <span className="text-faint">{k}</span>
            <span className="text-text-dim">{v}</span>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-text/90">{t.body}</p>

      <div className="mt-6 rounded-ui border border-border-soft bg-surface-0 p-4">
        <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-warn">
          {t.discTitle}
        </h3>
        <p className="text-xs leading-relaxed text-text-dim">{t.disclaimer}</p>
      </div>

      <p className="mt-auto pt-6 font-mono text-[11px] text-faint">
        cathode systems · workstation shell · v2
      </p>
    </div>
  );
}
