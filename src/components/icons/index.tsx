/**
 * Retrograde ikon sistemi — tek tutarlı dil (spec §4.3).
 * 24×24 viewBox · 1.5px stroke · kare uçlar (teknik çizim hissi) · currentColor.
 * Metin glif / emoji YOK — tüm sistem ikonları buradan gelir.
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
  close: <path d="M7 7l10 10M17 7L7 17" />,
  minimize: <path d="M6 16.5h12" />,
  maximize: <rect x="6.5" y="6.5" width="11" height="11" />,
  restore: (
    <>
      <path d="M9.5 9.5v-3h8v8h-3" />
      <rect x="6.5" y="9.5" width="8" height="8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9L19 19M19 5l-2.1 2.1M7.1 16.9L5 19" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <circle cx="12" cy="7.8" r="0.4" fill="currentColor" />
    </>
  ),
  doc: (
    <>
      <path d="M7 3.5h6l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13 3.5V8h4M9 12h6M9 15.5h6M9 8.5h2" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 8.5h10a4 4 0 0 1 4 4l-.5 3.2A2.4 2.4 0 0 1 16.4 17l-1.4-1.6H9L7.6 17A2.4 2.4 0 0 1 3.5 15.7L3 12.5a4 4 0 0 1 4-4Z" />
      <path d="M7 12.2h2.4M8.2 11v2.4" />
      <circle cx="15.5" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.3" cy="13.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  disk: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 4v6h8V4M14 6.2v1.6" />
      <rect x="8.5" y="13" width="7" height="4" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  bird: (
    <>
      <path d="M4 15c4 .5 6-1 7.5-3.2C13 9.6 15 7 19.5 6.5c-.3 3-1.8 5-4 6" />
      <path d="M11.5 11.8C11 15 9 18 5.5 19M19.5 6.5l.8-2" />
    </>
  ),
  upload: (
    <>
      <path d="M4 15v4.5h16V15" />
      <path d="M12 14.5V4M8 8l4-4 4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 3.5v3.4h-3.4" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 15.5l4.5-4 4 3.5 3-2.5 5.5 4" />
      <circle cx="9" cy="9.2" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  power: (
    <>
      <path d="M12 3.5V11" />
      <path d="M7.5 6.2a8 8 0 1 0 9 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  "chevron-left": <path d="M14.5 6L8.5 12l6 6" />,
  palette: (
    <>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <path d="M13 16.5h7M16.5 13v7" />
    </>
  ),
  crt: (
    <>
      <rect x="3" y="4.5" width="18" height="14" rx="2" />
      <path d="M6.5 8.5h11M6.5 11.5h11M6.5 14.5h7" strokeWidth={1.1} />
    </>
  ),
  motion: (
    <>
      <path d="M4 7.5h9M4 12h13M4 16.5h7" />
      <path d="M17.5 6l3 1.5-3 1.5" strokeWidth={1.2} />
    </>
  ),
  sound: (
    <>
      <path d="M5 9.5v5h3.5L13 19V5L8.5 9.5H5Z" />
      <path d="M16 9.5a4 4 0 0 1 0 5M18.3 7.5a7 7 0 0 1 0 9" />
    </>
  ),
  system: (
    <>
      <rect x="7" y="7" width="10" height="10" />
      <path d="M10 3.5V7M14 3.5V7M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
      <rect x="10.5" y="10.5" width="3" height="3" strokeWidth={1.1} />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.5v5.5c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-2.5Z" />
      <path d="M9 12l2.2 2.2L15.5 9.8" />
    </>
  ),
  folder: <path d="M4 7h5l2 2h9v9H4z" />,
  file: <path d="M7 4h7l4 4v12H7zM14 4v4h4" />,
  "folder-plus": (
    <>
      <path d="M4 7h5l2 2h9v9H4z" />
      <path d="M12 12v4M10 14h4" />
    </>
  ),
  save: <path d="M5 5h11l3 3v11H5zM8 5v5h7V5M8 19v-6h8v6" />,
  trash: <path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12" />,
  pencil: <path d="M4 20l4-1L19 8l-3-3L5 16z" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 16, className, strokeWidth = 1.5 }: IconProps) {
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
 * Retrograde markası — özgün çizim: fosfor ekran + tarama ışını.
 * Eski ◉ glifinin yerini alır (Windows/başka marka çağrışımı yok).
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
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      {/* ekran gövdesi */}
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      {/* tarama ışını + fosfor noktası */}
      <path d="M6 12h4.2M13.8 12H18" strokeWidth={1.2} />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      {/* üst scanline izleri */}
      <path d="M6.5 8.2h11M6.5 15.8h11" strokeWidth={0.9} opacity={0.55} />
    </svg>
  );
}
