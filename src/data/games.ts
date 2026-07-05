/**
 * DOS oyun/uygulama kayıt defteri (Faz 2.5 — js-dos / DOSBox-X).
 * Yalnızca telifsiz/serbest dağıtılan içerik. Bundle'lar R2'de barındırılır;
 * hazır olana dek "yakında". Kullanıcı kendi .jsdos/.zip'ini de yükleyebilir (BYOG).
 */

export interface GameBundle {
  url: string; // .jsdos veya .zip
}

export interface GameDefinition {
  id: string;
  name: string;
  glyph: string;
  description: string;
  bundle: GameBundle;
  enabled: boolean;
  license: string;
}

export const GAME_LIST: GameDefinition[] = [
  {
    id: "freedos-edit",
    // name/description i18n anahtarı — görünen yerde useT ile çözülür
    name: "games.freedosEditName",
    glyph: "▷",
    description: "games.freedosEditDesc",
    bundle: { url: "https://r2.example/freedos-tools.jsdos" },
    enabled: false,
    license: "açık kaynak (GPL)",
  },
  {
    id: "doom-shareware",
    name: "games.doomName",
    glyph: "✦",
    description: "games.doomDesc",
    bundle: { url: "https://r2.example/doom-sw.jsdos" },
    enabled: false,
    license: "shareware — serbest dağıtılır",
  },
];

const byId = new Map(GAME_LIST.map((g) => [g.id, g]));
export const getGame = (id: string) => byId.get(id);
export const enabledGames = () => GAME_LIST.filter((g) => g.enabled);
