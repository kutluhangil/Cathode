"use client";

/**
 * OPFS (Origin Private File System) tabanlı durum saklama.
 * v86 save-state blob'ları büyüktür (MB) — localStorage yetmez, OPFS uygun.
 * Sunucu yok; her şey kullanıcının tarayıcısında kalır.
 */

const DIR = "cathode-states";

function supported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function"
  );
}

async function dirHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!supported()) return null;
  try {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle(DIR, { create: true });
  } catch {
    return null;
  }
}

export async function writeState(
  key: string,
  data: ArrayBuffer,
): Promise<boolean> {
  const dir = await dirHandle();
  if (!dir) return false;
  try {
    const file = await dir.getFileHandle(`${key}.bin`, { create: true });
    const ws = await file.createWritable();
    await ws.write(data);
    await ws.close();
    return true;
  } catch {
    return false;
  }
}

export async function readState(key: string): Promise<ArrayBuffer | null> {
  const dir = await dirHandle();
  if (!dir) return null;
  try {
    const handle = await dir.getFileHandle(`${key}.bin`);
    const file = await handle.getFile();
    return await file.arrayBuffer();
  } catch {
    return null;
  }
}

export async function hasState(key: string): Promise<boolean> {
  const dir = await dirHandle();
  if (!dir) return false;
  try {
    await dir.getFileHandle(`${key}.bin`);
    return true;
  } catch {
    return false;
  }
}

export async function deleteState(key: string): Promise<void> {
  const dir = await dirHandle();
  if (!dir) return;
  try {
    await dir.removeEntry(`${key}.bin`);
  } catch {
    /* yok say */
  }
}
