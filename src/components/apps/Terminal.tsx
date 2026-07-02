"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useWindows } from "@/store/windowsStore";
import { APPS } from "@/data/apps";
import { BOOT_KEY } from "@/lib/layout";
import type { AccentName, WallpaperId } from "@/lib/types";

/** Bir satır: komut girişi ya da çıktı. */
interface Line {
  text: string;
  kind: "input" | "out" | "err";
}

const PROMPT = "guest@cathode:~$";

const BANNER = [
  "cathode shell v2.0 — phosphor terminal",
  'komutlar için "help" yaz.',
  "",
];

const WALLPAPERS: WallpaperId[] = [
  "phosphor",
  "blueprint",
  "testcard",
  "void",
  "photo",
];

/**
 * Cathode Shell — kabuğun kendi terminali.
 * Gerçek emülatör değil; kabuk ayarlarını komutla yöneten retro dokunuş.
 */
export function Terminal() {
  const [lines, setLines] = useState<Line[]>(
    BANNER.map((t) => ({ text: t, kind: "out" })),
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const print = (text: string, kind: Line["kind"] = "out") =>
    setLines((ls) => [...ls, ...text.split("\n").map((t) => ({ text: t, kind }))]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setLines((ls) => [...ls, { text: `${PROMPT} ${raw}`, kind: "input" }]);
    if (!cmd) return;
    setHistory((h) => [cmd, ...h].slice(0, 50));
    setHistIdx(-1);

    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");
    const settings = useSettings.getState();

    switch (name.toLowerCase()) {
      case "help":
        print(
          [
            "help              bu liste",
            "clear             ekranı temizle",
            "echo <metin>      metni yaz",
            "date              tarih/saat",
            "sysinfo           sistem künyesi",
            "apps              uygulama listesi",
            "open <id>         uygulama aç (örn: open notepad)",
            `wallpaper <ad>    duvar kâğıdı: ${WALLPAPERS.join(" | ")}`,
            "accent <renk>     amber | green",
            "crt on|off        CRT efektleri",
            "monitor on|off    Cathode 5100 çerçevesi",
            "reboot            boot sekansını tekrar oynat",
          ].join("\n"),
        );
        break;
      case "clear":
        setLines([]);
        break;
      case "echo":
        print(arg);
        break;
      case "date":
        print(new Date().toLocaleString("tr-TR"));
        break;
      case "sysinfo":
        print(
          [
            "  ┌─────────────┐",
            "  │  ▄▄▄▄▄▄▄▄▄  │   cathode systems 5100",
            "  │  █ ─────█▪█ │   kabuk: workstation v2",
            "  │  ▀▀▀▀▀▀▀▀▀  │   render: phosphor crt",
            "  └─────┬─┬─────┘   emülasyon: v86 · js-dos (wasm)",
            "     ▄▄▄┴─┴▄▄▄      veri: localStorage · OPFS — sunucu yok",
            `                    accent: ${settings.accent} · crt: ${settings.crt ? "on" : "off"} · monitör: ${settings.monitor ? "on" : "off"}`,
          ].join("\n"),
        );
        break;
      case "apps":
        print(APPS.map((a) => `${a.id.padEnd(14)} ${a.name}`).join("\n"));
        break;
      case "open": {
        const app = APPS.find((a) => a.id === arg);
        if (!app) {
          print(`uygulama yok: ${arg || "(boş)"} — "apps" ile listele`, "err");
          break;
        }
        useWindows.getState().open(app.id, app.name, app.defaultSize);
        print(`${app.name} açıldı`);
        break;
      }
      case "wallpaper": {
        if (!WALLPAPERS.includes(arg as WallpaperId)) {
          print(`geçersiz: ${arg || "(boş)"} — ${WALLPAPERS.join(" | ")}`, "err");
          break;
        }
        settings.setWallpaper(arg as WallpaperId);
        print(`duvar kâğıdı: ${arg}`);
        break;
      }
      case "accent": {
        if (arg !== "amber" && arg !== "green") {
          print("kullanım: accent amber | green", "err");
          break;
        }
        settings.setAccent(arg as AccentName);
        print(`accent: ${arg}`);
        break;
      }
      case "crt":
      case "monitor": {
        if (arg !== "on" && arg !== "off") {
          print(`kullanım: ${name} on | off`, "err");
          break;
        }
        const v = arg === "on";
        if (name === "crt") settings.setCrt(v);
        else settings.setMonitor(v);
        print(`${name}: ${arg}`);
        break;
      }
      case "reboot":
        sessionStorage.removeItem(BOOT_KEY);
        location.reload();
        break;
      default:
        print(`komut bulunamadı: ${name} — "help" yaz`, "err");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      if (history[next]) {
        setHistIdx(next);
        setInput(history[next]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = histIdx - 1;
      setHistIdx(next);
      setInput(next >= 0 ? history[next] : "");
    }
  };

  return (
    <div
      className="flex h-full flex-col bg-[#0a0a0c] font-mono text-[12px] leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "err"
                ? "text-danger"
                : l.kind === "input"
                  ? "text-text-dim"
                  : "text-text"
            }
          >
            {l.text || " "}
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="phosphor text-accent">{PROMPT}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            aria-label="terminal komut girişi"
            className="flex-1 bg-transparent text-text caret-[var(--accent)] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
