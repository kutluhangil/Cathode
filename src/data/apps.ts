import type { AppDefinition } from "@/lib/types";
import { About } from "@/components/apps/About";
import { Settings } from "@/components/apps/Settings";
import { Notepad } from "@/components/apps/Notepad";
import { Terminal } from "@/components/apps/Terminal";
import { Systems } from "@/components/apps/Systems";
import { Games } from "@/components/apps/Games";
import { FileManager } from "@/components/apps/FileManager";
import { Calculator } from "@/components/apps/Calculator";
import { ImageViewer } from "@/components/apps/ImageViewer";
import { Paint } from "@/components/apps/Paint";
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
  capturesKeyboard: true,
  singleton: true,
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
  capturesKeyboard: true,
  singleton: true,
}));

/** Uygulama kayıt defteri — masaüstü, dock ve başlat menüsü buradan beslenir. */
const baseApps: AppDefinition[] = [
  {
    id: "about",
    // name/description i18n anahtarı — görünen yerde useT ile çözülür
    name: "apps.about",
    glyph: "◈",
    description: "apps.aboutDesc",
    component: About,
    defaultSize: { w: 520, h: 460 },
    minSize: { w: 360, h: 320 },
    pinned: true,
  },
  {
    id: "settings",
    name: "apps.settings",
    glyph: "⚙",
    description: "apps.settingsDesc",
    component: Settings,
    defaultSize: { w: 640, h: 520 },
    minSize: { w: 520, h: 400 },
    pinned: true,
  },
  {
    id: "notepad",
    name: "apps.notepad",
    glyph: "▱",
    description: "apps.notepadDesc",
    component: Notepad,
    defaultSize: { w: 460, h: 420 },
    minSize: { w: 300, h: 240 },
    pinned: true,
  },
  {
    id: "filemanager",
    name: "apps.files",
    glyph: "▤",
    description: "apps.filesDesc",
    component: FileManager,
    defaultSize: { w: 620, h: 480 },
    minSize: { w: 420, h: 320 },
    pinned: true,
  },
  {
    id: "calculator",
    name: "apps.calculator",
    glyph: "=",
    description: "apps.calculatorDesc",
    component: Calculator,
    defaultSize: { w: 280, h: 400 },
    minSize: { w: 260, h: 360 },
    pinned: true,
  },
  {
    id: "paint",
    name: "apps.paint",
    glyph: "✎",
    description: "apps.paintDesc",
    component: Paint,
    defaultSize: { w: 560, h: 460 },
    minSize: { w: 420, h: 360 },
    pinned: true,
  },
  {
    id: "imageviewer",
    name: "apps.viewer",
    glyph: "▨",
    description: "apps.viewerDesc",
    component: ImageViewer,
    defaultSize: { w: 640, h: 480 },
    minSize: { w: 360, h: 280 },
  },
  {
    id: "terminal",
    name: "apps.terminal",
    glyph: ">_",
    description: "apps.terminalDesc",
    component: Terminal,
    defaultSize: { w: 560, h: 400 },
    minSize: { w: 360, h: 260 },
    pinned: true,
  },
  {
    id: "systems",
    name: "apps.systems",
    glyph: "▦",
    description: "apps.systemsDesc",
    component: Systems,
    defaultSize: { w: 560, h: 560 },
    minSize: { w: 420, h: 400 },
    pinned: true,
  },
  {
    id: "games",
    name: "apps.games",
    glyph: "✦",
    description: "apps.gamesDesc",
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
