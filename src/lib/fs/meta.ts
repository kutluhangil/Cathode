"use client";

import { isSupported } from "./vfs";

export interface FsMeta {
  positions: Record<string, { x: number; y: number }>;
}

const ROOT_DIR = "cathode-fs";
const META = ".cathode-meta.json";

async function root(): Promise<FileSystemDirectoryHandle> {
  const opfs = await navigator.storage.getDirectory();
  return opfs.getDirectoryHandle(ROOT_DIR, { create: true });
}

export async function readMeta(): Promise<FsMeta> {
  if (!isSupported()) return { positions: {} };
  try {
    const dir = await root();
    const fh = await dir.getFileHandle(META);
    const parsed = JSON.parse(await (await fh.getFile()).text());
    return { positions: parsed.positions ?? {} };
  } catch {
    return { positions: {} };
  }
}

export async function writeMeta(meta: FsMeta): Promise<void> {
  if (!isSupported()) return;
  const dir = await root();
  const fh = await dir.getFileHandle(META, { create: true });
  const ws = await fh.createWritable();
  await ws.write(JSON.stringify(meta));
  await ws.close();
}
