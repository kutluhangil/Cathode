"use client";

import { normalize, parent, basename, segments } from "./path";
import type { FsEntry } from "./types";

const ROOT_DIR = "cathode-fs";
const SEED = ["/Desktop", "/Documents", "/Pictures"];

export function isSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage?.getDirectory === "function"
  );
}

async function root(): Promise<FileSystemDirectoryHandle> {
  if (!isSupported()) throw new Error("OPFS not supported");
  const opfs = await navigator.storage.getDirectory();
  return opfs.getDirectoryHandle(ROOT_DIR, { create: true });
}

async function dirHandle(
  path: string,
  create = false,
): Promise<FileSystemDirectoryHandle> {
  let handle = await root();
  for (const seg of segments(path)) {
    handle = await handle.getDirectoryHandle(seg, { create });
  }
  return handle;
}

async function fileHandle(
  path: string,
  create = false,
): Promise<FileSystemFileHandle> {
  const dir = await dirHandle(parent(path), create);
  return dir.getFileHandle(basename(path), { create });
}

export async function mkdir(path: string): Promise<void> {
  await dirHandle(path, true);
}

export async function writeText(path: string, content: string): Promise<void> {
  await dirHandle(parent(path), true); // ensure parents exist
  const fh = await fileHandle(path, true);
  const ws = await fh.createWritable();
  await ws.write(content);
  await ws.close();
}

export async function readText(path: string): Promise<string> {
  const fh = await fileHandle(path, false);
  return (await fh.getFile()).text();
}

export async function writeBlob(
  path: string,
  data: Blob | ArrayBuffer,
): Promise<void> {
  await dirHandle(parent(path), true); // ensure parents exist
  const fh = await fileHandle(path, true);
  const ws = await fh.createWritable();
  await ws.write(data);
  await ws.close();
}

export async function readBlob(path: string): Promise<Blob> {
  const fh = await fileHandle(path, false);
  return fh.getFile();
}

export async function list(path: string): Promise<FsEntry[]> {
  const dir = await dirHandle(path, false);
  const entries: FsEntry[] = [];
  // @ts-expect-error OPFS directory async iterator is not yet in TS lib
  for await (const [name, handle] of dir.entries()) {
    if (name.startsWith(".")) continue; // hide dotfiles (meta sidecar)
    const p = normalize(path + "/" + name);
    if (handle.kind === "directory") {
      entries.push({ name, path: p, kind: "dir", size: 0, modified: 0 });
    } else {
      const file = await (handle as FileSystemFileHandle).getFile();
      entries.push({
        name,
        path: p,
        kind: "file",
        size: file.size,
        modified: file.lastModified,
      });
    }
  }
  entries.sort((a, b) =>
    a.kind !== b.kind
      ? a.kind === "dir"
        ? -1
        : 1
      : a.name.localeCompare(b.name),
  );
  return entries;
}

export async function exists(path: string): Promise<boolean> {
  const p = normalize(path);
  if (p === "/") return true;
  try {
    const dir = await dirHandle(parent(p), false);
    const base = basename(p);
    // @ts-expect-error OPFS directory async iterator
    for await (const [name] of dir.entries()) {
      if (name === base) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function stat(path: string): Promise<FsEntry | null> {
  const p = normalize(path);
  const items = await list(parent(p)).catch(() => [] as FsEntry[]);
  return items.find((e) => e.path === p) ?? null;
}

export async function remove(path: string): Promise<void> {
  const p = normalize(path);
  const dir = await dirHandle(parent(p), false);
  await dir.removeEntry(basename(p), { recursive: true });
}

async function copyRec(srcPath: string, destPath: string): Promise<void> {
  const st = await stat(srcPath);
  if (!st) throw new Error(`source not found: ${srcPath}`);
  if (st.kind === "dir") {
    await mkdir(destPath);
    for (const child of await list(srcPath)) {
      await copyRec(child.path, normalize(destPath + "/" + child.name));
    }
  } else {
    // byte copy — preserves both text and binary content
    const bytes = await (await readBlob(srcPath)).arrayBuffer();
    await writeBlob(destPath, bytes);
  }
}

export async function rename(path: string, newName: string): Promise<string> {
  const dest = normalize(parent(path) + "/" + newName);
  if (await exists(dest)) throw new Error(`already exists: ${dest}`);
  await copyRec(path, dest);
  await remove(path);
  return dest;
}

export async function move(srcPath: string, destDir: string): Promise<string> {
  const dest = normalize(destDir + "/" + basename(srcPath));
  if (await exists(dest)) throw new Error(`already exists: ${dest}`);
  await copyRec(srcPath, dest);
  await remove(srcPath);
  return dest;
}

export async function ensureSeed(): Promise<void> {
  const top = await list("/").catch(() => [] as FsEntry[]);
  if (top.length === 0) {
    for (const d of SEED) await mkdir(d);
  }
}
