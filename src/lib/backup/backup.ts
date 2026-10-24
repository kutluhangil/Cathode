"use client";

import { zip, unzip, type ZipEntry } from "./zip";

/**
 * Tüm yerel veriyi tek .zip'e al / geri yükle (sunucu yok — dosya cihazda kalır).
 * İçerik: OPFS'teki dosyalar + emülatör kayıtları ve "retrograde*" localStorage anahtarları.
 */

const OPFS_DIRS = ["retrograde-fs", "retrograde-states"] as const;
const LS_PREFIX = "retrograde";
const MANIFEST = "manifest.json";
const LOCAL_STORAGE = "localStorage.json";
const FORMAT = 1;

interface Manifest {
  app: "retrograde";
  format: number;
  created: string;
}

type DirIter = AsyncIterable<[string, FileSystemHandle]>;
const entriesOf = (dir: FileSystemDirectoryHandle) =>
  (dir as unknown as { entries: () => DirIter }).entries();

async function collect(dir: FileSystemDirectoryHandle, prefix: string, out: ZipEntry[]) {
  for await (const [name, handle] of entriesOf(dir)) {
    const path = `${prefix}/${name}`;
    if (handle.kind === "directory") await collect(handle as FileSystemDirectoryHandle, path, out);
    else {
      const file = await (handle as FileSystemFileHandle).getFile();
      out.push({ name: path, data: new Uint8Array(await file.arrayBuffer()) });
    }
  }
}

export async function createBackup(): Promise<Blob> {
  const enc = new TextEncoder();
  const manifest: Manifest = { app: "retrograde", format: FORMAT, created: new Date().toISOString() };
  const entries: ZipEntry[] = [{ name: MANIFEST, data: enc.encode(JSON.stringify(manifest, null, 2)) }];

  const ls: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX)) ls[key] = localStorage.getItem(key) ?? "";
  }
  entries.push({ name: LOCAL_STORAGE, data: enc.encode(JSON.stringify(ls, null, 2)) });

  const root = await navigator.storage.getDirectory();
  for (const d of OPFS_DIRS) {
    const handle = await root.getDirectoryHandle(d, { create: true });
    await collect(handle, `opfs/${d}`, entries);
  }
  return zip(entries);
}

/** Arşivden gelen yol güvenilmez girdidir: yalnız izinli kökler, ".."/boş segment yok. */
function safeOpfsPath(name: string): { dir: string; segs: string[] } | null {
  const segs = name.split("/");
  if (segs[0] !== "opfs" || !OPFS_DIRS.includes(segs[1] as (typeof OPFS_DIRS)[number])) return null;
  const rest = segs.slice(2);
  if (rest.length === 0 || rest.some((s) => !s || s === "." || s === ".." || s.includes("\\"))) return null;
  return { dir: segs[1], segs: rest };
}

/**
 * Yedeği doğrula ve mevcut verinin YERİNE yaz. Doğrulama yazmadan önce biter:
 * bozuk/yabancı arşiv mevcut veriye dokunmadan hata verir.
 */
export async function restoreBackup(file: Blob): Promise<void> {
  const entries = unzip(await file.arrayBuffer());
  const dec = new TextDecoder();
  const byName = new Map(entries.map((e) => [e.name, e]));

  const manifestEntry = byName.get(MANIFEST);
  if (!manifestEntry) throw new Error("backup.invalid");
  const manifest = JSON.parse(dec.decode(manifestEntry.data)) as Partial<Manifest>;
  if (manifest.app !== "retrograde" || manifest.format !== FORMAT) throw new Error("backup.invalid");

  const lsEntry = byName.get(LOCAL_STORAGE);
  const ls = lsEntry ? (JSON.parse(dec.decode(lsEntry.data)) as Record<string, unknown>) : {};
  const files = entries
    .filter((e) => e.name.startsWith("opfs/"))
    .map((e) => ({ target: safeOpfsPath(e.name), data: e.data }));
  if (files.some((f) => !f.target)) throw new Error("backup.invalid");

  const root = await navigator.storage.getDirectory();
  for (const d of OPFS_DIRS) await root.removeEntry(d, { recursive: true }).catch(() => undefined);
  for (const f of files) {
    const { dir, segs } = f.target!;
    let handle = await root.getDirectoryHandle(dir, { create: true });
    for (const s of segs.slice(0, -1)) handle = await handle.getDirectoryHandle(s, { create: true });
    const fh = await handle.getFileHandle(segs[segs.length - 1], { create: true });
    const ws = await fh.createWritable();
    await ws.write(f.data as Uint8Array<ArrayBuffer>);
    await ws.close();
  }

  for (const key of Object.keys(localStorage)) if (key.startsWith(LS_PREFIX)) localStorage.removeItem(key);
  for (const [key, value] of Object.entries(ls))
    if (key.startsWith(LS_PREFIX) && typeof value === "string") localStorage.setItem(key, value);
}
