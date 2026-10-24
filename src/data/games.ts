/**
 * DOS oyun/uygulama kayıt defteri (Faz 2.5 — js-dos / DOSBox-X).
 * Yalnızca telifsiz/serbest dağıtılan içerik. Bundle'lar R2'de barındırılır;
 * hazır olana dek "yakında". Kullanıcı kendi .jsdos/.zip'ini de yükleyebilir (BYOG).
 */

export type GameBundle =
  | { url: string } // hazır .jsdos bundle
  /** orijinal dağıtım zip'i (değiştirilmeden) + çalıştırılacak dosya; dosbox.conf üretilir */
  | { zip: string; exec: string };

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
    // id Software DOOM v1.9 shareware — setup:emu indirir (sha256 doğrulamalı), git'e girmez
    bundle: { zip: "/games/doom-sw-1.9.zip", exec: "DOOM.EXE" },
    enabled: true,
    license: "shareware — değiştirilmeden serbest dağıtılır",
  },
];

const byId = new Map(GAME_LIST.map((g) => [g.id, g]));
export const getGame = (id: string) => byId.get(id);
export const enabledGames = () => GAME_LIST.filter((g) => g.enabled);
