"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/store/settingsStore";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { APPS } from "@/data/apps";
import { BOOT_KEY } from "@/lib/layout";
import type { AccentName, WallpaperId } from "@/lib/types";

/** Bir satır: komut girişi ya da çıktı. */
interface Line {
  text: string;
  kind: "input" | "out" | "err";
}

const PROMPT = "guest@cathode:~$";

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
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const [lines, setLines] = useState<Line[]>(() =>
    [t("terminal.bannerTitle"), t("terminal.bannerHelp"), ""].map((text) => ({
      text,
      kind: "out" as const,
    })),
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
        print(t("terminal.help", { wallpapers: WALLPAPERS.join(" | ") }));
        break;
      case "clear":
        setLines([]);
        break;
      case "echo":
        print(arg);
        break;
      case "date":
        print(new Date().toLocaleString(lang === "tr" ? "tr-TR" : "en-US"));
        break;
      case "sysinfo":
        print(
          t("terminal.sysinfo", {
            accent: settings.accent,
            crt: settings.crt ? "on" : "off",
            monitor: settings.monitor ? "on" : "off",
          }),
        );
        break;
      case "apps":
        print(APPS.map((a) => `${a.id.padEnd(14)} ${a.name}`).join("\n"));
        break;
      case "open": {
        const app = APPS.find((a) => a.id === arg);
        if (!app) {
          print(
            t("terminal.openNotFound", { arg: arg || t("terminal.emptyArg") }),
            "err",
          );
          break;
        }
        useWindows.getState().open(app.id, app.name, app.defaultSize);
        print(t("terminal.opened", { name: app.name }));
        break;
      }
      case "wallpaper": {
        if (!WALLPAPERS.includes(arg as WallpaperId)) {
          print(
            t("terminal.wpInvalid", {
              arg: arg || t("terminal.emptyArg"),
              wallpapers: WALLPAPERS.join(" | "),
            }),
            "err",
          );
          break;
        }
        settings.setWallpaper(arg as WallpaperId);
        print(t("terminal.wpSet", { arg }));
        break;
      }
      case "accent": {
        const accents: AccentName[] = ["amber", "green", "blue", "white"];
        if (!accents.includes(arg as AccentName)) {
          print(t("terminal.accentUsage"), "err");
          break;
        }
        settings.setAccent(arg as AccentName);
        print(t("terminal.accentSet", { arg }));
        break;
      }
      case "crt":
      case "monitor": {
        if (arg !== "on" && arg !== "off") {
          print(t("terminal.onOffUsage", { name }), "err");
          break;
        }
        const v = arg === "on";
        if (name === "crt") settings.setCrt(v);
        else settings.setMonitor(v);
        print(t("terminal.toggleSet", { name, arg }));
        break;
      }
      case "reboot":
        sessionStorage.removeItem(BOOT_KEY);
        location.reload();
        break;
      // gizli komutlar (help'te listelenmez) — easter egg
      case "xyzzy":
        print("Nothing happens.");
        break;
      case "credits":
        print(
          [
            "Cathode — bespoke retro OS shell",
            "",
            "emulation : v86 (copy.sh) · js-dos (DOSBox-X)",
            "systems   : KolibriOS · FreeDOS · ReactOS",
            "shell     : Kutluhan",
            "",
            "thanks for booting up ♥",
          ].join("\n"),
        );
        break;
      case "neofetch":
        print(
          [
            "   ▟█▙     guest@cathode",
            "  ▟███▙    ---------------",
            " ▟█████▙   os     : Obsidian Cathode",
            " ▜█████▛   shell  : cathode-sh",
            "  ▜███▛    accent : " + settings.accent,
            "   ▜█▛     crt    : " + (settings.crt ? "on" : "off"),
            "           uptime : ∞ (client-side)",
          ].join("\n"),
        );
        break;
      default:
        print(t("terminal.notFound", { name }), "err");
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
            aria-label={t("terminal.inputAria")}
            className="flex-1 bg-transparent text-text caret-[var(--accent)] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
