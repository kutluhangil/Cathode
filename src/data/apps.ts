import type { AppDefinition } from "@/lib/types";
import { About } from "@/components/apps/About";
import { Settings } from "@/components/apps/Settings";
import { Notepad } from "@/components/apps/Notepad";
import { Systems } from "@/components/apps/Systems";
import { Games } from "@/components/apps/Games";
import { LazyEmulator } from "@/components/apps/emulator/LazyEmulator";
import { LazyJsDos } from "@/components/apps/emulator/LazyJsDos";
import { enabledOs } from "@/data/os";
import { enabledGames } from "@/data/games";

/** Etkin OS'ler için otomatik uygulama girişleri — masaüstü/dock/başlat'ta ikon olur. */
const osApps: AppDefinition[] = enabledOs().map((os) => ({
  id: `os-${os.id}`,
  name: os.name,
  glyph: os.glyph,
  description: os.description,
  component: () => LazyEmulator({ os }),
  defaultSize: { w: 760, h: 560 },
  minSize: { w: 480, h: 360 },
}));

/** Etkin DOS oyunları için otomatik uygulama girişleri. */
const gameApps: AppDefinition[] = enabledGames().map((g) => ({
  id: `game-${g.id}`,
  name: g.name,
  glyph: g.glyph,
  description: g.description,
  component: () => LazyJsDos({ game: g }),
  defaultSize: { w: 720, h: 540 },
  minSize: { w: 480, h: 360 },
}));

/** Uygulama kayıt defteri — masaüstü, dock ve başlat menüsü buradan beslenir. */
const baseApps: AppDefinition[] = [
  {
    id: "about",
    name: "Hakkında",
    glyph: "◈",
    description: "Cathode nedir, yasal not",
    component: About,
    defaultSize: { w: 520, h: 460 },
    minSize: { w: 360, h: 320 },
    pinned: true,
  },
  {
    id: "settings",
    name: "Ayarlar",
    glyph: "⚙",
    description: "Tema, CRT, duvar kâğıdı",
    component: Settings,
    defaultSize: { w: 480, h: 520 },
    minSize: { w: 360, h: 360 },
    pinned: true,
  },
  {
    id: "notepad",
    name: "Not defteri",
    glyph: "▱",
    description: "Hızlı notlar (kalıcı)",
    component: Notepad,
    defaultSize: { w: 460, h: 420 },
    minSize: { w: 300, h: 240 },
    pinned: true,
  },
  {
    id: "systems",
    name: "Sistemler",
    glyph: "▦",
    description: "Emülatör · OS kataloğu + kendi imajın",
    component: Systems,
    defaultSize: { w: 560, h: 560 },
    minSize: { w: 420, h: 400 },
    pinned: true,
  },
  {
    id: "games",
    name: "Oyunlar",
    glyph: "✦",
    description: "DOS oyunları · js-dos + kendi bundle'ın",
    component: Games,
    defaultSize: { w: 560, h: 560 },
    minSize: { w: 420, h: 400 },
    pinned: true,
  },
];

export const APPS: AppDefinition[] = [...baseApps, ...osApps, ...gameApps];

const byId = new Map(APPS.map((a) => [a.id, a]));

export function getApp(id: string): AppDefinition | undefined {
  return byId.get(id);
}
