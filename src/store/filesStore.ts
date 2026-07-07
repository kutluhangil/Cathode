"use client";

import { create } from "zustand";
import * as vfs from "@/lib/fs/vfs";
import { readMeta, writeMeta } from "@/lib/fs/meta";
import { parent, normalize } from "@/lib/fs/path";
import type { FsEntry } from "@/lib/fs/types";

interface FilesState {
  supported: boolean;
  hydrated: boolean;
  entriesByDir: Record<string, FsEntry[]>;
  positions: Record<string, { x: number; y: number }>;
  hydrate: () => Promise<void>;
  refresh: (dir: string) => Promise<void>;
  createFile: (dir: string, name: string, content?: string) => Promise<string>;
  writeBlob: (dir: string, name: string, data: Blob) => Promise<string>;
  createDir: (dir: string, name: string) => Promise<string>;
  rename: (path: string, newName: string) => Promise<string>;
  remove: (path: string) => Promise<void>;
  move: (srcPath: string, destDir: string) => Promise<string>;
  setPosition: (path: string, x: number, y: number) => void;
}

let metaTimer: ReturnType<typeof setTimeout> | null = null;
function queueMeta(get: () => FilesState) {
  if (metaTimer) clearTimeout(metaTimer);
  metaTimer = setTimeout(() => {
    void writeMeta({ positions: get().positions });
  }, 300);
}

export const useFiles = create<FilesState>((set, get) => ({
  supported: vfs.isSupported(),
  hydrated: false,
  entriesByDir: {},
  positions: {},

  hydrate: async () => {
    if (!vfs.isSupported()) {
      set({ supported: false, hydrated: true });
      return;
    }
    await vfs.ensureSeed();
    const meta = await readMeta();
    set({ positions: meta.positions });
    await get().refresh("/");
    await get().refresh("/Desktop");
    set({ hydrated: true });
  },

  refresh: async (dir) => {
    const items = await vfs.list(dir).catch(() => [] as FsEntry[]);
    set((s) => ({
      entriesByDir: { ...s.entriesByDir, [normalize(dir)]: items },
    }));
  },

  createFile: async (dir, name, content = "") => {
    const path = normalize(dir + "/" + name);
    await vfs.writeText(path, content);
    await get().refresh(dir);
    return path;
  },

  writeBlob: async (dir, name, data) => {
    const path = normalize(dir + "/" + name);
    await vfs.writeBlob(path, data);
    await get().refresh(dir);
    return path;
  },

  createDir: async (dir, name) => {
    const path = normalize(dir + "/" + name);
    await vfs.mkdir(path);
    await get().refresh(dir);
    return path;
  },

  rename: async (path, newName) => {
    const dest = await vfs.rename(path, newName);
    await get().refresh(parent(path));
    set((s) => {
      if (!s.positions[path]) return {};
      const positions = { ...s.positions };
      positions[dest] = positions[path];
      delete positions[path];
      queueMeta(get);
      return { positions };
    });
    return dest;
  },

  remove: async (path) => {
    await vfs.remove(path);
    await get().refresh(parent(path));
    set((s) => {
      if (!s.positions[path]) return {};
      const positions = { ...s.positions };
      delete positions[path];
      queueMeta(get);
      return { positions };
    });
  },

  move: async (srcPath, destDir) => {
    const dest = await vfs.move(srcPath, destDir);
    await get().refresh(parent(srcPath));
    await get().refresh(destDir);
    set((s) => {
      if (!s.positions[srcPath]) return {};
      const positions = { ...s.positions };
      positions[dest] = positions[srcPath];
      delete positions[srcPath];
      queueMeta(get);
      return { positions };
    });
    return dest;
  },

  setPosition: (path, x, y) => {
    set((s) => ({ positions: { ...s.positions, [path]: { x, y } } }));
    queueMeta(get);
  },
}));

// Test/debug bridge — lets Playwright e2e drive the store directly (client-only,
// no server/privacy impact; all state is already in the browser).
if (typeof window !== "undefined") {
  (window as unknown as { __files?: typeof useFiles }).__files = useFiles;
}
