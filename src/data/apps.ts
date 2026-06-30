import type { AppDefinition } from "@/lib/types";
import { About } from "@/components/apps/About";
import { Settings } from "@/components/apps/Settings";
import { Notepad } from "@/components/apps/Notepad";

/** Uygulama kayıt defteri — masaüstü, dock ve başlat menüsü buradan beslenir. */
export const APPS: AppDefinition[] = [
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
];

const byId = new Map(APPS.map((a) => [a.id, a]));

export function getApp(id: string): AppDefinition | undefined {
  return byId.get(id);
}
