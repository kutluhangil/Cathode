"use client";

import type { AppDefinition } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Tanınır uygulama ikonları — her uygulama kendi rengi + net sembolü.
 * macOS/Linux tarzı yuvarlak kabartma fayans. Soyut glyph yok.
 */

interface IconDef {
  /** fayans arka plan gradyanı */
  bg: string;
  /** sembol rengi */
  fg: string;
  svg: React.ReactNode;
}

const S = {
  // sık kullanılan stroke ayarı
  stroke: {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  },
};

const gear = (
  <g {...S.stroke}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19" />
  </g>
);

const doc = (
  <g {...S.stroke}>
    <path d="M7 3.5h6l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
    <path d="M13 3.5V8h4M9 12h6M9 15.5h6M9 8.5h2" />
  </g>
);

const monitor = (
  <g {...S.stroke}>
    <rect x="3" y="4" width="18" height="12" rx="1.6" />
    <path d="M9 20h6M12 16v4" />
    <path d="M6.5 8.5l2 2-2 2" strokeWidth={1.4} />
  </g>
);

const gamepad = (
  <g {...S.stroke}>
    <path d="M7 8.5h10a4 4 0 0 1 4 4l-.5 3.2A2.4 2.4 0 0 1 16.4 17l-1.4-1.6H9L7.6 17A2.4 2.4 0 0 1 3.5 15.7L3 12.5a4 4 0 0 1 4-4Z" />
    <path d="M7 12.2h2.4M8.2 11v2.4" />
    <circle cx="15.5" cy="11.8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="17.3" cy="13.4" r=".9" fill="currentColor" stroke="none" />
  </g>
);

const info = (
  <g {...S.stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.8" r=".4" fill="currentColor" stroke="currentColor" strokeWidth={1.4} />
  </g>
);

const terminal = (
  <g {...S.stroke}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" />
  </g>
);

const bird = (
  // KolibriOS — hafiflik: stilize kuş/kanat
  <g {...S.stroke}>
    <path d="M4 15c4 .5 6-1 7.5-3.2C13 9.6 15 7 19.5 6.5c-.3 3-1.8 5-4 6" />
    <path d="M11.5 11.8C11 15 9 18 5.5 19M19.5 6.5l.8-2" />
  </g>
);

const disk = (
  <g {...S.stroke}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 4v6h8V4M14 6.2v1.6" />
    <rect x="8.5" y="13" width="7" height="4" rx=".6" />
  </g>
);

// uygulama id → ikon
const ICONS: Record<string, IconDef> = {
  about: {
    bg: "linear-gradient(145deg,#2a3550,#141a2b)",
    fg: "#8fb4ff",
    svg: info,
  },
  settings: {
    bg: "linear-gradient(145deg,#33343a,#1a1b1f)",
    fg: "#c9c8c4",
    svg: gear,
  },
  notepad: {
    bg: "linear-gradient(145deg,#4a3b18,#241d0d)",
    fg: "#ffcf6b",
    svg: doc,
  },
  systems: {
    bg: "linear-gradient(145deg,#173a2c,#0c1f18)",
    fg: "#57e39b",
    svg: monitor,
  },
  games: {
    bg: "linear-gradient(145deg,#3a1c47,#1e0f26)",
    fg: "#d08bff",
    svg: gamepad,
  },
  "os-kolibri": {
    bg: "linear-gradient(145deg,#123a42,#082025)",
    fg: "#5fe3e0",
    svg: bird,
  },
  "os-freedos": {
    bg: "linear-gradient(145deg,#16341f,#0a1c11)",
    fg: "#79e06a",
    svg: terminal,
  },
};

function pickIcon(id: string): IconDef {
  if (ICONS[id]) return ICONS[id];
  if (id.startsWith("os-"))
    return { bg: "linear-gradient(145deg,#2b2b33,#151519)", fg: "#e9e6df", svg: disk };
  if (id.startsWith("game-"))
    return {
      bg: "linear-gradient(145deg,#3a1c47,#1e0f26)",
      fg: "#d08bff",
      svg: gamepad,
    };
  return { bg: "linear-gradient(145deg,#2b2b33,#151519)", fg: "var(--accent)", svg: disk };
}

interface Props {
  app: Pick<AppDefinition, "id">;
  size?: number;
  className?: string;
}

export function AppIcon({ app, size = 44, className }: Props) {
  const icon = pickIcon(app.id);
  const radius = Math.round(size * 0.26);
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: icon.bg,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.35)",
      }}
    >
      {/* üst parlama */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-40"
        style={{
          background:
            "linear-gradient(180deg,rgba(255,255,255,0.25),transparent)",
        }}
      />
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        style={{ color: icon.fg }}
      >
        {icon.svg}
      </svg>
    </span>
  );
}
