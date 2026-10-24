/**
 * 1.44 MB FAT12 disket imajı üret / oku — VFS ↔ emüle DOS dosya köprüsü (B: sürücüsü).
 * Yalnız kök dizin (alt klasör yok); uzun adlar 8.3'e indirgenir.
 */

export interface FloppyFile {
  name: string;
  data: Uint8Array;
}

const SECTOR = 512;
const TOTAL_SECTORS = 2880;
const FAT_SECTORS = 9;
const ROOT_ENTRIES = 224;
const ROOT_SECTORS = (ROOT_ENTRIES * 32) / SECTOR; // 14
const DATA_START = 1 + 2 * FAT_SECTORS + ROOT_SECTORS; // 33
const CLUSTERS = TOTAL_SECTORS - DATA_START; // 1 sektör/cluster
export const FLOPPY_CAPACITY = CLUSTERS * SECTOR;

const VALID = /[A-Z0-9!#$%&'()\-@^_`{}~]/;
const clean = (s: string) =>
  Array.from(s.toUpperCase())
    .filter((c) => VALID.test(c))
    .join("");

/** "rapor taslağı.txt" → "RAPORTAS.TXT"; çakışmada "RAPORT~1.TXT". */
export function toShortName(name: string, taken: Set<string>): string {
  const dot = name.lastIndexOf(".");
  const rawBase = dot > 0 ? name.slice(0, dot) : name;
  const rawExt = dot > 0 ? name.slice(dot + 1) : "";
  const base = clean(rawBase) || "FILE";
  const ext = clean(rawExt).slice(0, 3);
  const join = (b: string) => (ext ? `${b}.${ext}` : b);

  const direct = join(base.slice(0, 8));
  const lossless = base.length <= 8 && clean(rawBase) === rawBase.toUpperCase() && ext === rawExt.toUpperCase();
  if (lossless && !taken.has(direct)) return direct;
  for (let n = 1; n < 1000; n++) {
    const tail = `~${n}`;
    const candidate = join(base.slice(0, 8 - tail.length) + tail);
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("too many similar names");
}

function setFat12(fat: Uint8Array, cluster: number, value: number) {
  const off = Math.floor((cluster * 3) / 2);
  if (cluster & 1) {
    fat[off] = (fat[off] & 0x0f) | ((value << 4) & 0xf0);
    fat[off + 1] = (value >> 4) & 0xff;
  } else {
    fat[off] = value & 0xff;
    fat[off + 1] = (fat[off + 1] & 0xf0) | ((value >> 8) & 0x0f);
  }
}

function getFat12(fat: Uint8Array, cluster: number): number {
  const off = Math.floor((cluster * 3) / 2);
  const v = fat[off] | (fat[off + 1] << 8);
  return cluster & 1 ? v >> 4 : v & 0xfff;
}

/** Dosyalar 8.3 adlarıyla kök dizine yazılır. Dönen map: kısa ad → orijinal ad. */
export function buildFloppy(files: FloppyFile[]): { image: Uint8Array; names: Map<string, string> } {
  if (files.length > ROOT_ENTRIES) throw new Error("floppy.tooMany");
  const needed = files.reduce((n, f) => n + Math.ceil(f.data.length / SECTOR), 0);
  if (needed > CLUSTERS) throw new Error("floppy.full");

  const img = new Uint8Array(TOTAL_SECTORS * SECTOR);
  const v = new DataView(img.buffer);
  // boot sektörü + BPB (DOS 3.31 uyumlu, açılış kodu yok)
  img.set([0xeb, 0x3c, 0x90], 0);
  img.set(new TextEncoder().encode("RETROGRD"), 3);
  v.setUint16(11, SECTOR, true);
  img[13] = 1; // sektör/cluster
  v.setUint16(14, 1, true); // ayrılmış sektör
  img[16] = 2; // FAT sayısı
  v.setUint16(17, ROOT_ENTRIES, true);
  v.setUint16(19, TOTAL_SECTORS, true);
  img[21] = 0xf0; // medya: 3.5" 1.44 MB
  v.setUint16(22, FAT_SECTORS, true);
  v.setUint16(24, 18, true); // sektör/iz
  v.setUint16(26, 2, true); // kafa
  img[38] = 0x29;
  v.setUint32(39, 0x52455452, true); // seri no
  img.set(new TextEncoder().encode("RETROGRADE FAT12   "), 43);
  img[510] = 0x55;
  img[511] = 0xaa;

  const fat = new Uint8Array(FAT_SECTORS * SECTOR);
  setFat12(fat, 0, 0xff0);
  setFat12(fat, 1, 0xfff);

  const now = new Date();
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const names = new Map<string, string>();
  const taken = new Set<string>();
  let cluster = 2;
  const rootOff = (1 + 2 * FAT_SECTORS) * SECTOR;
  files.forEach((f, i) => {
    const short = toShortName(f.name, taken);
    taken.add(short);
    names.set(short, f.name);
    const [b, e = ""] = short.split(".");
    const entry = rootOff + i * 32;
    img.set(new TextEncoder().encode(b.padEnd(8, " ") + e.padEnd(3, " ")), entry);
    img[entry + 11] = 0x20; // arşiv
    v.setUint16(entry + 24, dosDate, true);
    const count = Math.ceil(f.data.length / SECTOR);
    v.setUint16(entry + 26, count ? cluster : 0, true);
    v.setUint32(entry + 28, f.data.length, true);
    for (let c = 0; c < count; c++) {
      setFat12(fat, cluster + c, c === count - 1 ? 0xfff : cluster + c + 1);
    }
    img.set(f.data, (DATA_START + cluster - 2) * SECTOR);
    cluster += count;
  });

  img.set(fat, SECTOR);
  img.set(fat, SECTOR * (1 + FAT_SECTORS));
  return { image: img, names };
}

/** Kök dizindeki dosyaları oku (DOS'un biçimlendirdiği disketler dahil — BPB'den okunur). */
export function readFloppy(img: Uint8Array): FloppyFile[] {
  const v = new DataView(img.buffer, img.byteOffset, img.byteLength);
  const bps = v.getUint16(11, true);
  const spc = img[13];
  const reserved = v.getUint16(14, true);
  const fats = img[16];
  const rootEntries = v.getUint16(17, true);
  const fatSectors = v.getUint16(22, true);
  if (!bps || !spc || !fats || !rootEntries || !fatSectors) throw new Error("floppy.unformatted");

  const fat = img.subarray(reserved * bps, (reserved + fatSectors) * bps);
  const rootOff = (reserved + fats * fatSectors) * bps;
  const dataOff = rootOff + Math.ceil((rootEntries * 32) / bps) * bps;
  const clusterBytes = spc * bps;
  const maxCluster = Math.floor((img.length - dataOff) / clusterBytes) + 1;
  const dec = new TextDecoder("ascii");
  const out: FloppyFile[] = [];

  for (let i = 0; i < rootEntries; i++) {
    const e = rootOff + i * 32;
    const first = img[e];
    if (first === 0x00) break; // dizin sonu
    const attr = img[e + 11];
    if (first === 0xe5 || attr === 0x0f || attr & 0x18) continue; // silinmiş / LFN / etiket / klasör
    const base = dec.decode(img.subarray(e, e + 8)).trimEnd();
    const ext = dec.decode(img.subarray(e + 8, e + 11)).trimEnd();
    const size = v.getUint32(e + 28, true);
    const data = new Uint8Array(size);
    let cluster = v.getUint16(e + 26, true);
    let written = 0;
    const seen = new Set<number>();
    while (written < size && cluster >= 2 && cluster <= maxCluster && !seen.has(cluster)) {
      seen.add(cluster); // döngülü zincire karşı
      const off = dataOff + (cluster - 2) * clusterBytes;
      const chunk = img.subarray(off, off + Math.min(clusterBytes, size - written));
      data.set(chunk, written);
      written += chunk.length;
      cluster = getFat12(fat, cluster);
    }
    out.push({ name: ext ? `${base}.${ext}` : base, data: data.subarray(0, written) });
  }
  return out;
}
