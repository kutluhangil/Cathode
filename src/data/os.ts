/**
 * OS kayıt defteri (Faz 2).
 * Güvenli set: tamamen açık/serbest dağıtılan sistemler. XP YOK (spec §5).
 * Büyük imajlar Cloudflare R2'de, HTTP range request ile streaming (async).
 * Küçük serbest imaj (KolibriOS, GPL) yerelde gömülü — R2 olmadan da çalışır.
 */

export type EmuEngine = "v86" | "jsdos";
export type DiskDrive = "fda" | "hda" | "cdrom";

export interface OsImageSource {
  url: string;
  /** range request ile parça parça indir (büyük HDD imajları) */
  async?: boolean;
  /** async için zorunlu — imaj boyutu (byte) */
  size?: number;
}

export interface OsDefinition {
  id: string;
  name: string;
  glyph: string;
  description: string;
  engine: EmuEngine;
  drive: DiskDrive;
  image: OsImageSource;
  memoryMB: number;
  vgaMB: number;
  bootOrder?: number;
  /** false = katalogda "yakında" olarak görünür, açılamaz (imaj R2'de hazır değil) */
  enabled: boolean;
  license: string;
}

export const OS_LIST: OsDefinition[] = [
  {
    id: "kolibri",
    name: "KolibriOS",
    glyph: "❉",
    description: "Asm ile yazılmış ultra hafif sistem · serbest (GPL)",
    engine: "v86",
    drive: "fda",
    image: { url: "/images/kolibri.img" },
    memoryMB: 128,
    vgaMB: 8,
    enabled: true,
    license: "GPL — serbest dağıtılır",
  },
  {
    id: "reactos",
    name: "ReactOS",
    glyph: "◐",
    description: "Açık kaynak Windows-uyumlu sistem · en güvenli set",
    engine: "v86",
    drive: "hda",
    image: { url: "https://r2.example/reactos.img", async: true, size: 0 },
    memoryMB: 512,
    vgaMB: 32,
    enabled: false,
    license: "açık kaynak (GPL/LGPL)",
  },
  {
    id: "freedos",
    name: "FreeDOS",
    glyph: "▶",
    description: "Açık kaynak DOS · gömülü, hemen açılır",
    engine: "v86",
    drive: "fda",
    image: { url: "/images/freedos722.img" },
    memoryMB: 64,
    vgaMB: 8,
    enabled: true,
    license: "açık kaynak (GPL) — serbest dağıtılır",
  },
  {
    id: "win31",
    name: "Windows 3.1",
    glyph: "◨",
    description: "Klasik 16-bit masaüstü · arşiv/nostalji",
    engine: "v86",
    drive: "hda",
    image: { url: "https://r2.example/win31.img", async: true, size: 0 },
    memoryMB: 64,
    vgaMB: 8,
    enabled: false,
    license: "telif sahibine ait · arşiv amaçlı (R2/BYOI)",
  },
  {
    id: "win98",
    name: "Windows 98",
    glyph: "◫",
    description: "Klasik 9x masaüstü · arşiv/nostalji",
    engine: "v86",
    drive: "hda",
    image: { url: "https://r2.example/win98.img", async: true, size: 0 },
    memoryMB: 256,
    vgaMB: 16,
    enabled: false,
    license: "telif sahibine ait · arşiv amaçlı",
  },
  {
    id: "win2000",
    name: "Windows 2000",
    glyph: "◳",
    description: 'NT çekirdeği · "Standart PC" tipi',
    engine: "v86",
    drive: "hda",
    image: { url: "https://r2.example/win2000.img", async: true, size: 0 },
    memoryMB: 512,
    vgaMB: 32,
    enabled: false,
    license: "telif sahibine ait · arşiv amaçlı",
  },
];

const osById = new Map(OS_LIST.map((o) => [o.id, o]));
export const getOs = (id: string) => osById.get(id);
export const enabledOs = () => OS_LIST.filter((o) => o.enabled);
