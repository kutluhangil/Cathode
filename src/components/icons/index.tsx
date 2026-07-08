/**
 * Retrograde ikon sistemi — kalın, bloklu (chunky) ve tam bir DOS/retro hissiyatı.
 * 24×24 viewBox · 2px stroke · kare uçlar · currentColor.
 */

export type IconName =
  | "close"
  | "minimize"
  | "maximize"
  | "restore"
  | "settings"
  | "info"
  | "doc"
  | "monitor"
  | "gamepad"
  | "disk"
  | "terminal"
  | "bird"
  | "upload"
  | "refresh"
  | "image"
  | "power"
  | "search"
  | "chevron-left"
  | "palette"
  | "crt"
  | "motion"
  | "sound"
  | "system"
  | "shield"
  | "folder"
  | "file"
  | "folder-plus"
  | "save"
  | "trash"
  | "pencil";

const PATHS: Record<IconName, React.ReactNode> = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  minimize: <path d="M5 18h14" />,
  maximize: <path d="M4 4h16v16H4z" />,
  restore: (
    <>
      <path d="M8 4h12v12h-3V7H8z" />
      <path d="M4 8h12v12H4z" />
    </>
  ),
  settings: (
    <>
      <path d="M10 10h4v4h-4z" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" />
    </>
  ),
  info: (
    <>
      <path d="M10 3h4l3 3v8l-3 3h-4l-3-3V6z" />
      <path d="M12 10v4" />
      <path d="M12 7v1" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  monitor: (
    <>
      <path d="M3 4h18v12H3z" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  gamepad: (
    <>
      <path d="M4 14v-6h16v6l-2 4H6z" />
      <path d="M7 11h4M9 9v4" />
      <path d="M15 11h.01M17 11h.01" />
    </>
  ),
  disk: (
    <>
      <path d="M4 4h12l4 4v12H4z" />
      <path d="M7 4v5h7V4" />
      <path d="M8 14h8v6H8z" />
    </>
  ),
  terminal: (
    <>
      <path d="M3 4h18v15H3z" />
      <path d="M7 8l3 3-3 3" />
      <path d="M12 14h4" />
    </>
  ),
  bird: (
    <>
      <path d="M4 14l4-2 3-5 5-2c2 0 3 2 3 2l-3 4-4 2M8 12l2 6-4 2" />
    </>
  ),
  upload: (
    <>
      <path d="M5 18h14" />
      <path d="M12 14V4M8 8l4-4 4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M12 4v4h-4" />
      <path d="M12 4h4l3 3v8l-3 3h-8l-3-3V9" />
    </>
  ),
  image: (
    <>
      <path d="M3 4h18v16H3z" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <path d="M8 9h.01" />
    </>
  ),
  power: (
    <>
      <path d="M12 3v8" />
      <path d="M8 5l-2 2v8l2 2h8l2-2V7l-2-2" />
    </>
  ),
  search: (
    <>
      <path d="M9 3h4l3 3v4l-3 3H9l-3-3V6z" />
      <path d="M14 14l6 6" />
    </>
  ),
  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  palette: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 17h6M17 14v6" />
    </>
  ),
  crt: (
    <>
      <path d="M3 5h18v14H3z" />
      <path d="M6 9h12M6 13h12" />
    </>
  ),
  motion: (
    <>
      <path d="M4 8h10M4 12h14M4 16h6" />
      <path d="M17 5l3 3-3 3" />
    </>
  ),
  sound: (
    <>
      <path d="M6 10v4h3l4 4V6l-4 4z" />
      <path d="M16 9v6" />
      <path d="M19 7v10" />
    </>
  ),
  system: (
    <>
      <path d="M8 8h8v8H8z" />
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6l-2 5-6 4-6-4-2-5V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  folder: <path d="M3 6h5l2 3h11v9H3z" />,
  file: <path d="M6 3h8l5 5v13H6zM14 3v5h5" />,
  "folder-plus": (
    <>
      <path d="M3 6h5l2 3h11v9H3z" />
      <path d="M12 12v6M9 15h6" />
    </>
  ),
  save: <path d="M4 4h12l4 4v12H4zM8 4v5h8V4M8 14h8v6H8z" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7v13h12V7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  pencil: <path d="M5 19h3L18 9l-3-3L5 16z" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const AI_ICONS = new Set([
  "bird", "close", "disk", "doc", "gamepad", "image", "info",
  "maximize", "minimize", "monitor", "power", "refresh", "restore",
  "settings", "terminal", "upload"
]);

export function Icon({ name, size = 16, className, strokeWidth = 2 }: IconProps) {
  if (AI_ICONS.has(name)) {
    return (
      <img
        src={`/icons/${name}.png`}
        alt={`${name} icon`}
        width={size}
        height={size}
        className={className}
        style={{ imageRendering: "pixelated", objectFit: "contain" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * Retrograde markası — kalın fosfor ekran, retro bloklu.
 */
export function RetrogradeMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      {/* kalın ekran gövdesi */}
      <path d="M3 5h18v14H3z" />
      {/* blok fosfor izi */}
      <path d="M6 12h5M15 12h3" />
      <path d="M12 12h.01" strokeWidth={3} />
      {/* üst/alt scanline izleri */}
      <path d="M7 8h10M7 16h10" strokeWidth={1} opacity={0.4} />
    </svg>
  );
}
