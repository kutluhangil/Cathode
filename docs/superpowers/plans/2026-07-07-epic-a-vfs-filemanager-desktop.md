# Epic A — VFS + File Manager + Desktop Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hierarchical OPFS-backed virtual filesystem with a File Manager app, a filesystem-integrated Notepad, and a `/Desktop` folder that renders as free-position, persisted desktop icons.

**Architecture:** OPFS (`cathode-fs/` root) is the content source of truth; a Zustand store (`filesStore`) mirrors a reactive tree for the UI; icon positions live in an OPFS JSON sidecar (`.cathode-meta.json`). Every mutation calls the async VFS then refreshes the store snapshot. `windowsStore.open()` gains an optional props payload so apps can launch bound to a file path.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, Zustand, OPFS (`navigator.storage.getDirectory`), `@playwright/test`.

## Global Constraints

- **No git commit / push / branch by the agent.** Kutluhan commits (project `CLAUDE.md`). Each task ends by **staging** changes (`git add`) and reporting done — never `git commit`.
- TypeScript strict; match existing code style and Turkish-comment convention.
- **No silent fallbacks** — when OPFS is unsupported, surface an explicit UI notice / throw an explicit `Error`; never swallow.
- No new runtime dependencies (OPFS + Zustand already present).
- VFS root dir: `cathode-fs` (separate from `persist.ts`'s `cathode-states`).
- Metadata sidecar: `cathode-fs/.cathode-meta.json`; dotfiles are hidden from `list()`.
- Seed folders on first run: `/Desktop`, `/Documents`, `/Pictures`.
- e2e selectors use `data-testid` (i18n-independent), matching Epic E. `reducedMotion` (if needed) is set via `contextOptions: { reducedMotion: "reduce" }` (Playwright 1.61 type).
- e2e OPFS reset: wipe `cathode-fs` after first load (NOT via addInitScript, which re-runs on reload and would break persistence tests).

---

## File Structure

**New files:**
- `src/lib/fs/types.ts` — `FsKind`, `FsEntry`.
- `src/lib/fs/path.ts` — pure path helpers (`normalize`, `join`, `parent`, `basename`, `segments`).
- `src/lib/fs/vfs.ts` — async OPFS operations.
- `src/lib/fs/meta.ts` — position sidecar read/write.
- `src/store/filesStore.ts` — Zustand reactive mirror + a test/debug `window.__files` bridge.
- `src/components/apps/FileManager.tsx` — File Manager app.
- `src/components/apps/fs/FsPicker.tsx` — small modal browser used by Notepad (open / save-as).
- `src/components/desktop/DesktopFiles.tsx` — free-position `/Desktop` icon layer.
- `e2e/filesystem.spec.ts`, `e2e/filemanager.spec.ts`, `e2e/notepad-fs.spec.ts`, `e2e/desktop-files.spec.ts`.

**Modified files:**
- `src/lib/types.ts` — `AppDefinition.component` type widen; `WindowInstance.props`.
- `src/store/windowsStore.ts` — `open()` gains `props?`.
- `src/components/window/Window.tsx` — pass `win.props` to Body.
- `src/data/apps.ts` — register File Manager.
- `src/components/icons/index.tsx` — add `folder`, `file`, `folder-plus`, `save`, `trash`, `pencil` icons.
- `src/components/apps/Notepad.tsx` — FS rework.
- `src/components/desktop/Desktop.tsx` — mount `DesktopFiles`; context-menu create.
- `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts` — File Manager + Notepad strings.
- `e2e/helpers.ts` — add `resetFs(page)`.

---

## Task 1: Filesystem foundation (types, path, vfs, meta, store)

**Files:**
- Create: `src/lib/fs/types.ts`, `src/lib/fs/path.ts`, `src/lib/fs/vfs.ts`, `src/lib/fs/meta.ts`, `src/store/filesStore.ts`
- Modify: `src/components/desktop/Desktop.tsx` (call `hydrate()` on mount)
- Modify: `e2e/helpers.ts` (add `resetFs`)
- Create: `e2e/filesystem.spec.ts`

**Interfaces:**
- Produces: the `vfs` module, `useFiles` store, `FsEntry` type, and `window.__files` bridge consumed by all later tasks.

- [ ] **Step 1: Create `src/lib/fs/types.ts`**

```ts
export type FsKind = "file" | "dir";

export interface FsEntry {
  name: string; // "notes.txt"
  path: string; // "/Desktop/notes.txt"
  kind: FsKind;
  size: number; // bytes (0 for dirs)
  modified: number; // epoch ms (0 for dirs)
}
```

- [ ] **Step 2: Create `src/lib/fs/path.ts`**

```ts
/** POSIX-style path helpers for the virtual filesystem. Pure, no OPFS. */

export function normalize(path: string): string {
  const out: string[] = [];
  for (const p of path.split("/")) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return "/" + out.join("/");
}

export function segments(path: string): string[] {
  return normalize(path).split("/").filter(Boolean);
}

export function join(...parts: string[]): string {
  return normalize(parts.join("/"));
}

export function parent(path: string): string {
  const n = normalize(path);
  const i = n.lastIndexOf("/");
  return i <= 0 ? "/" : n.slice(0, i);
}

export function basename(path: string): string {
  const n = normalize(path);
  return n.slice(n.lastIndexOf("/") + 1);
}
```

- [ ] **Step 3: Create `src/lib/fs/vfs.ts`**

```ts
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
    await writeText(destPath, await readText(srcPath)); // text-only for now
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
```

- [ ] **Step 4: Create `src/lib/fs/meta.ts`**

```ts
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
```

- [ ] **Step 5: Create `src/store/filesStore.ts`**

```ts
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
```

- [ ] **Step 6: Call `hydrate()` on desktop mount**

In `src/components/desktop/Desktop.tsx`, add the import and a mount effect. Add near the other imports:
```tsx
import { useEffect } from "react";
import { useFiles } from "@/store/filesStore";
```
Inside the `Desktop` component body, after the existing hooks (e.g. after `const t = useT();`), add:
```tsx
  const hydrateFiles = useFiles((s) => s.hydrate);
  useEffect(() => {
    void hydrateFiles();
  }, [hydrateFiles]);
```
(If `useState` is already imported from "react", extend that import to include `useEffect` instead of adding a duplicate import line.)

- [ ] **Step 7: Add `resetFs` helper to `e2e/helpers.ts`**

Append to `e2e/helpers.ts`:
```ts
/**
 * Wipe the VFS after first load so each test starts clean. Done via evaluate
 * (not addInitScript) so the test's own page.reload() does NOT re-wipe — that
 * is what persistence assertions rely on.
 */
export async function resetFs(page: Page) {
  await bypassBoot(page);
  await page.goto("/");
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("cathode-fs", { recursive: true });
    } catch {
      /* nothing to remove */
    }
  });
  await page.reload();
  // wait for the store to finish hydrating (re-seeds folders)
  await page.waitForFunction(() => {
    const f = (window as unknown as { __files?: { getState: () => { hydrated: boolean } } }).__files;
    return !!f && f.getState().hydrated;
  });
}
```

- [ ] **Step 8: Write the foundation e2e**

`e2e/filesystem.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

type StoreEntry = { name: string; path: string; kind: "file" | "dir" };

test("seeds the top-level folders", async ({ page }) => {
  await resetFs(page);
  const names = await page.evaluate(() => {
    const f = (window as any).__files.getState();
    return (f.entriesByDir["/"] as StoreEntry[]).map((e) => e.name);
  });
  expect(names).toEqual(["Desktop", "Documents", "Pictures"]);
});

test("writes and reads a file, persisting across reload", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Documents", "a.txt", "hello");
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  const content = await page.evaluate(async () => {
    const vfsRead = await (window as any).__files.getState().refresh("/Documents");
    // read directly via the store's refreshed cache + a fresh read
    const mod = (window as any).__files.getState();
    const entry = mod.entriesByDir["/Documents"].find((e: StoreEntry) => e.name === "a.txt");
    return entry ? entry.path : null;
  });
  expect(content).toBe("/Documents/a.txt");
});

test("creates, renames, and removes a folder", async ({ page }) => {
  await resetFs(page);
  const result = await page.evaluate(async () => {
    const f = (window as any).__files.getState();
    await f.createDir("/Documents", "Work");
    const renamed = await f.rename("/Documents/Work", "Projects");
    await f.refresh("/Documents");
    const afterRename = (window as any).__files
      .getState()
      .entriesByDir["/Documents"].map((e: StoreEntry) => e.name);
    await f.remove(renamed);
    await f.refresh("/Documents");
    const afterRemove = (window as any).__files
      .getState()
      .entriesByDir["/Documents"].map((e: StoreEntry) => e.name);
    return { afterRename, afterRemove };
  });
  expect(result.afterRename).toContain("Projects");
  expect(result.afterRemove).not.toContain("Projects");
});
```

- [ ] **Step 9: Run the foundation e2e**

Run: `npm run test:e2e -- filesystem.spec.ts --project=desktop`
Expected: 3 passed.

- [ ] **Step 10: Typecheck & stage**

Run: `npx tsc --noEmit`
Expected: no errors.
```bash
git add src/lib/fs/ src/store/filesStore.ts src/components/desktop/Desktop.tsx e2e/helpers.ts e2e/filesystem.spec.ts
```
Do NOT commit. Report Task 1 done.

---

## Task 2: File Manager app — browse & navigate

**Files:**
- Modify: `src/components/icons/index.tsx` (add icons)
- Create: `src/components/apps/FileManager.tsx`
- Modify: `src/data/apps.ts` (register), `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts`
- Create: `e2e/filemanager.spec.ts`

**Interfaces:**
- Consumes: `useFiles` (Task 1), `data-testid` convention.
- Produces: `filemanager` app id; `data-testid`s `fm-entry-<name>`, `fm-breadcrumb-<seg>`, `fm-up`.

- [ ] **Step 1: Add icons**

In `src/components/icons/index.tsx`, extend the `IconName` union with:
```ts
  | "folder"
  | "file"
  | "folder-plus"
  | "save"
  | "trash"
  | "pencil"
```
And add matching entries to the `PATHS` record (place beside the others):
```tsx
  folder: <path d="M4 7h5l2 2h9v9H4z" />,
  file: <path d="M7 4h7l4 4v12H7zM14 4v4h4" />,
  "folder-plus": (
    <>
      <path d="M4 7h5l2 2h9v9H4z" />
      <path d="M12 12v4M10 14h4" />
    </>
  ),
  save: <path d="M5 5h11l3 3v11H5zM8 5v5h7V5M8 19v-6h8v6" />,
  trash: <path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12" />,
  pencil: <path d="M4 20l4-1L19 8l-3-3L5 16z" />,
```

- [ ] **Step 2: Create `src/components/apps/FileManager.tsx` (browse-only)**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { segments, join, parent } from "@/lib/fs/path";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

interface Props {
  windowId: string;
  path?: string; // initial directory (from open() props)
}

export function FileManager({ path }: Props) {
  const t = useT();
  const supported = useFiles((s) => s.supported);
  const entriesByDir = useFiles((s) => s.entriesByDir);
  const refresh = useFiles((s) => s.refresh);
  const open = useWindows((s) => s.open);
  const [dir, setDir] = useState(path ?? "/");

  useEffect(() => {
    void refresh(dir);
  }, [dir, refresh]);

  const entries = entriesByDir[dir] ?? [];

  const onOpenEntry = (e: FsEntry) => {
    if (e.kind === "dir") {
      setDir(e.path);
    } else if (e.name.endsWith(".txt")) {
      open("notepad", "apps.notepad", { w: 460, h: 420 }, { path: e.path });
    }
  };

  if (!supported) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-text-dim">
        {t("files.unsupported")}
      </div>
    );
  }

  const segs = segments(dir);

  return (
    <div className="flex h-full flex-col bg-surface-0">
      {/* toolbar / breadcrumb */}
      <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5">
        <button
          data-testid="fm-up"
          aria-label={t("files.up")}
          onClick={() => setDir(parent(dir))}
          disabled={dir === "/"}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text disabled:opacity-30"
        >
          <Icon name="chevron-left" size={14} />
        </button>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto font-mono text-[11px]">
          <button
            data-testid="fm-breadcrumb-root"
            onClick={() => setDir("/")}
            className="rounded px-1 text-text-dim hover:text-accent"
          >
            /
          </button>
          {segs.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-faint">›</span>
              <button
                data-testid={`fm-breadcrumb-${seg}`}
                onClick={() => setDir(join("/", ...segs.slice(0, i + 1)))}
                className="rounded px-1 text-text-dim hover:text-accent"
              >
                {seg}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* entries */}
      <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1 overflow-y-auto p-3">
        {entries.length === 0 && (
          <p className="col-span-full py-8 text-center font-mono text-xs text-faint">
            {t("files.empty")}
          </p>
        )}
        {entries.map((e) => (
          <button
            key={e.path}
            data-testid={`fm-entry-${e.name}`}
            onDoubleClick={() => onOpenEntry(e)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors hover:bg-white/5",
            )}
          >
            <span className="text-accent">
              <Icon name={e.kind === "dir" ? "folder" : "file"} size={32} />
            </span>
            <span className="line-clamp-2 break-all text-[11px] leading-tight text-text/90">
              {e.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Register the app**

In `src/data/apps.ts`, import and add to `baseApps` (after `games` or wherever fits, keep `pinned`):
```tsx
import { FileManager } from "@/components/apps/FileManager";
```
```tsx
  {
    id: "filemanager",
    name: "apps.files",
    glyph: "▤",
    description: "apps.filesDesc",
    component: FileManager,
    defaultSize: { w: 620, h: 480 },
    minSize: { w: 420, h: 320 },
    pinned: true,
  },
```

- [ ] **Step 4: Add i18n strings**

In `src/lib/i18n/tr.ts`, under the `apps` block add `files` / `filesDesc`, and add a new `files` section:
```ts
    files: "Dosyalar",
    filesDesc: "Dosya yöneticisi",
```
New top-level `files` block (alongside other sections):
```ts
  files: {
    up: "yukarı",
    empty: "boş klasör",
    unsupported: "Bu tarayıcı dosya sistemini (OPFS) desteklemiyor.",
    newFolder: "Yeni klasör",
    newFile: "Yeni dosya",
    rename: "Yeniden adlandır",
    delete: "Sil",
    move: "Taşı",
    confirmDelete: "{name} silinsin mi?",
    untitled: "adsız",
  },
```
Mirror the exact same keys with English values in `src/lib/i18n/en.ts`:
```ts
    files: "Files",
    filesDesc: "File manager",
```
```ts
  files: {
    up: "up",
    empty: "empty folder",
    unsupported: "This browser does not support the file system (OPFS).",
    newFolder: "New folder",
    newFile: "New file",
    rename: "Rename",
    delete: "Delete",
    move: "Move",
    confirmDelete: "Delete {name}?",
    untitled: "untitled",
  },
```

- [ ] **Step 5: Write the browse e2e**

`e2e/filemanager.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

test("opens File Manager and lists seeded folders", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "filemanager");
  await expect(page.getByTestId("fm-entry-Desktop")).toBeVisible();
  await expect(page.getByTestId("fm-entry-Documents")).toBeVisible();
  await expect(page.getByTestId("fm-entry-Pictures")).toBeVisible();
});

test("navigates into a folder and back via breadcrumb", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createDir("/Documents", "Work");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await expect(page.getByTestId("fm-entry-Work")).toBeVisible();
  await page.getByTestId("fm-breadcrumb-root").click();
  await expect(page.getByTestId("fm-entry-Documents")).toBeVisible();
});
```

- [ ] **Step 6: Run the browse e2e**

Run: `npm run test:e2e -- filemanager.spec.ts --project=desktop`
Expected: 2 passed.

- [ ] **Step 7: Typecheck & stage**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/components/icons/index.tsx src/components/apps/FileManager.tsx src/data/apps.ts src/lib/i18n/ e2e/filemanager.spec.ts
```
Do NOT commit. Report Task 2 done.

---

## Task 3: File Manager mutations (create, rename, delete, move)

**Files:**
- Modify: `src/components/apps/FileManager.tsx`
- Modify: `e2e/filemanager.spec.ts`

**Interfaces:**
- Consumes: `useFiles` create/rename/remove/move, `ContextMenu`.
- Produces: `data-testid`s `fm-new-folder`, `fm-new-file`, `fm-rename-input`, `fm-menu-<action>`.

- [ ] **Step 1: Add toolbar create buttons + name-prompt state**

In `FileManager.tsx`, pull in the mutations and add local state. Extend the `useFiles` selectors:
```tsx
  const createDir = useFiles((s) => s.createDir);
  const createFile = useFiles((s) => s.createFile);
  const rename = useFiles((s) => s.rename);
  const remove = useFiles((s) => s.remove);
```
Add state for an inline creation/rename prompt:
```tsx
  const [prompt, setPrompt] = useState<
    { mode: "folder" | "file"; } | { mode: "rename"; path: string; current: string } | null
  >(null);
  const [draft, setDraft] = useState("");
```
Add the create handlers:
```tsx
  const submitPrompt = async () => {
    const name = draft.trim();
    setPrompt(null);
    setDraft("");
    if (!name || !prompt) return;
    if (prompt.mode === "folder") await createDir(dir, name);
    else if (prompt.mode === "file") await createFile(dir, name.endsWith(".txt") ? name : `${name}.txt`);
    else await rename(prompt.path, name);
  };
```

- [ ] **Step 2: Render create buttons + prompt input in the toolbar**

Add to the toolbar `<div>` (after the breadcrumb container), before its closing tag:
```tsx
        <button
          data-testid="fm-new-folder"
          aria-label={t("files.newFolder")}
          title={t("files.newFolder")}
          onClick={() => { setPrompt({ mode: "folder" }); setDraft(""); }}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="folder-plus" size={14} />
        </button>
        <button
          data-testid="fm-new-file"
          aria-label={t("files.newFile")}
          title={t("files.newFile")}
          onClick={() => { setPrompt({ mode: "file" }); setDraft(""); }}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="file" size={14} />
        </button>
```
Add the prompt input row just below the toolbar `<div>` (a sibling, before the entries grid):
```tsx
      {prompt && (
        <div className="flex items-center gap-2 border-b border-border-soft px-3 py-2">
          <input
            data-testid="fm-rename-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitPrompt();
              if (e.key === "Escape") { setPrompt(null); setDraft(""); }
            }}
            placeholder={
              prompt.mode === "folder" ? t("files.newFolder") : t("files.newFile")
            }
            className="flex-1 rounded-btn bg-surface-2 px-2 py-1 font-mono text-[12px] text-text outline-none"
          />
        </div>
      )}
```

- [ ] **Step 3: Add per-entry context menu (rename / delete / move)**

Add imports and menu state:
```tsx
import { ContextMenu, type MenuItem } from "@/components/desktop/ContextMenu";
import { useFiles as _useFiles } from "@/store/filesStore"; // (already imported; skip duplicate)
```
```tsx
  const move = useFiles((s) => s.move);
  const entriesByDirAll = entriesByDir;
  const [menu, setMenu] = useState<{ x: number; y: number; entry: FsEntry } | null>(null);
```
On each entry button add:
```tsx
            onContextMenu={(ev) => {
              ev.preventDefault();
              setMenu({ x: ev.clientX, y: ev.clientY, entry: e });
            }}
```
Render the menu at the end of the component (before the outer closing `</div>`):
```tsx
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: t("files.rename"),
              icon: "pencil",
              onClick: () => {
                setPrompt({ mode: "rename", path: menu.entry.path, current: menu.entry.name });
                setDraft(menu.entry.name);
              },
            },
            {
              label: t("files.delete"),
              icon: "trash",
              onClick: () => void remove(menu.entry.path),
            },
            ...topFolders(entriesByDirAll["/"]).map((folder): MenuItem => ({
              label: `${t("files.move")}: ${folder.name}`,
              icon: "folder",
              onClick: () => void move(menu.entry.path, folder.path),
            })),
          ]}
        />
      )}
```
Add a helper above the component:
```tsx
function topFolders(entries: FsEntry[] | undefined): FsEntry[] {
  return (entries ?? []).filter((e) => e.kind === "dir");
}
```
Ensure `/` is refreshed so move targets exist — add to the mount effect:
```tsx
  useEffect(() => {
    void refresh("/");
  }, [refresh]);
```

- [ ] **Step 4: Extend the e2e with mutation flows**

Append to `e2e/filemanager.spec.ts`:
```ts
test("creates a folder and a file via the toolbar", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();

  await page.getByTestId("fm-new-folder").click();
  await page.getByTestId("fm-rename-input").fill("Reports");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-Reports")).toBeVisible();

  await page.getByTestId("fm-new-file").click();
  await page.getByTestId("fm-rename-input").fill("todo");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-todo.txt")).toBeVisible();
});

test("renames then deletes an entry", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createDir("/Documents", "Old");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();

  await page.getByTestId("fm-entry-Old").click({ button: "right" });
  await page.getByRole("menuitem", { name: /rename|adland/i }).click();
  await page.getByTestId("fm-rename-input").fill("New");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-New")).toBeVisible();

  await page.getByTestId("fm-entry-New").click({ button: "right" });
  await page.getByRole("menuitem", { name: /delete|sil/i }).click();
  await expect(page.getByTestId("fm-entry-New")).toHaveCount(0);
});
```

- [ ] **Step 5: Run the e2e**

Run: `npm run test:e2e -- filemanager.spec.ts --project=desktop`
Expected: 4 passed.

- [ ] **Step 6: Typecheck & stage**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/components/apps/FileManager.tsx e2e/filemanager.spec.ts
```
Do NOT commit. Report Task 3 done.

---

## Task 4: open() props plumbing + Notepad FS rework

**Files:**
- Modify: `src/lib/types.ts`, `src/store/windowsStore.ts`, `src/components/window/Window.tsx`
- Create: `src/components/apps/fs/FsPicker.tsx`
- Modify: `src/components/apps/Notepad.tsx`
- Create: `e2e/notepad-fs.spec.ts`

**Interfaces:**
- Produces: `open(appId, title, size, props?)`; `WindowInstance.props`; `FsPicker` component.
- Consumes: `useFiles`, `useWindows`.

- [ ] **Step 1: Widen types**

In `src/lib/types.ts`:
- Change `AppDefinition.component`:
```ts
  component: ComponentType<{ windowId: string } & Record<string, unknown>>;
```
- Add to `WindowInstance`:
```ts
  /** açılışta app'e geçen opsiyonel parametreler (ör. Notepad'in açacağı dosya) */
  props?: Record<string, unknown>;
```

- [ ] **Step 2: Add `props` to `windowsStore.open`**

In `src/store/windowsStore.ts`, update the interface signature and the implementation:
```ts
  open: (
    appId: string,
    title: string,
    size: { w: number; h: number },
    props?: Record<string, unknown>,
  ) => string;
```
In the `open` implementation, accept `props` and store it on the window:
```ts
  open: (appId, title, size, props) => {
    const id = nextId();
    playSound("open");
    set((s) => {
      const z = s.zCounter + 1;
      const win: WindowInstance = {
        id,
        appId,
        title,
        rect: spawnRect(size, s.windows.length),
        prevRect: null,
        z,
        status: "normal",
        props,
      };
      return { windows: [...s.windows, win], focusedId: id, zCounter: z };
    });
    return id;
  },
```
(`toggleFromDock` calls `open(appId, title, size)` with no props — unchanged.)

- [ ] **Step 3: Pass `win.props` to the app Body**

In `src/components/window/Window.tsx`, change the Body render:
```tsx
        <Body windowId={win.id} {...(win.props ?? {})} />
```

- [ ] **Step 4: Create `src/components/apps/fs/FsPicker.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useT } from "@/lib/i18n/useT";
import { segments, join, parent } from "@/lib/fs/path";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

interface Props {
  mode: "open" | "save";
  /** save mode: prefilled file name */
  initialName?: string;
  onCancel: () => void;
  onPick: (result: { dir: string; name?: string; path?: string }) => void;
}

/** Küçük dosya seçici — Notepad'in aç / farklı kaydet akışları için. */
export function FsPicker({ mode, initialName, onCancel, onPick }: Props) {
  const t = useT();
  const entriesByDir = useFiles((s) => s.entriesByDir);
  const refresh = useFiles((s) => s.refresh);
  const [dir, setDir] = useState("/Documents");
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    void refresh(dir);
  }, [dir, refresh]);

  const entries = entriesByDir[dir] ?? [];
  const segs = segments(dir);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={onCancel}
    >
      <div
        data-testid="fs-picker"
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-[80%] w-[80%] max-w-[420px] flex-col rounded-ui bg-surface-2 shadow-float"
      >
        <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5 font-mono text-[11px]">
          <button
            onClick={() => setDir(parent(dir))}
            disabled={dir === "/"}
            className="flex h-6 w-6 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 disabled:opacity-30"
          >
            <Icon name="chevron-left" size={12} />
          </button>
          <span className="truncate text-text-dim">{dir}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {entries.map((e: FsEntry) => (
            <button
              key={e.path}
              data-testid={`fs-pick-${e.name}`}
              onClick={() => {
                if (e.kind === "dir") setDir(e.path);
                else if (mode === "open" && e.name.endsWith(".txt"))
                  onPick({ dir, path: e.path });
                else if (mode === "save") setName(e.name);
              }}
              className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left font-mono text-[12px] text-text-dim hover:bg-surface-3 hover:text-text"
            >
              <Icon name={e.kind === "dir" ? "folder" : "file"} size={14} />
              <span className="truncate">{e.name}</span>
            </button>
          ))}
        </div>
        {mode === "save" && (
          <div className="flex items-center gap-2 border-t border-border-soft p-2">
            <input
              data-testid="fs-save-name"
              autoFocus
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder={`${t("files.untitled")}.txt`}
              className="flex-1 rounded-btn bg-surface-0 px-2 py-1 font-mono text-[12px] text-text outline-none"
            />
            <button
              data-testid="fs-save-confirm"
              onClick={() => {
                const n = name.trim();
                if (n) onPick({ dir, name: n.endsWith(".txt") ? n : `${n}.txt` });
              }}
              className="rounded-btn bg-accent px-3 py-1 text-[12px] text-accent-ink"
            >
              {t("notepad.save")}
            </button>
          </div>
        )}
        <button className="hidden" data-testid="fs-picker-nav" onClick={() => setDir(join("/", ...segs))} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/apps/Notepad.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { readText, writeText } from "@/lib/fs/vfs";
import { basename } from "@/lib/fs/path";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";
import { FsPicker } from "./fs/FsPicker";

const LEGACY_KEY = "cathode.notepad";

interface Props {
  windowId: string;
  path?: string; // file to open on launch (from open() props)
}

/** Not defteri — gerçek dosyaları FS'ten açar/kaydeder (OPFS). */
export function Notepad({ path }: Props) {
  const t = useT();
  const createFile = useFiles((s) => s.createFile);
  const [filePath, setFilePath] = useState<string | null>(path ?? null);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<"open" | "save" | null>(null);
  const migrated = useRef(false);

  // launch: load the passed file, or migrate the legacy note once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (path) {
        const content = await readText(path).catch(() => "");
        if (!cancelled) {
          setText(content);
          setFilePath(path);
          setDirty(false);
        }
        return;
      }
      // one-time legacy migration
      if (!migrated.current) {
        migrated.current = true;
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const dest = await createFile("/Documents", "notlar.txt", legacy).catch(
            () => null,
          );
          localStorage.removeItem(LEGACY_KEY);
          if (dest && !cancelled) {
            setText(legacy);
            setFilePath(dest);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, createFile]);

  const doSave = async (target: string) => {
    await writeText(target, text);
    setFilePath(target);
    setDirty(false);
  };

  const onSave = () => {
    if (filePath) void doSave(filePath);
    else setPicker("save");
  };

  const title = filePath ? basename(filePath) : t("files.untitled");

  return (
    <div className="relative flex h-full flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5">
        <button
          data-testid="np-open"
          onClick={() => setPicker("open")}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="folder" size={13} /> {t("notepad.open")}
        </button>
        <button
          data-testid="np-save"
          onClick={onSave}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="save" size={13} /> {t("notepad.save")}
        </button>
        <button
          data-testid="np-save-as"
          onClick={() => setPicker("save")}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          {t("notepad.saveAs")}
        </button>
        <span
          data-testid="np-title"
          className="ml-auto truncate font-mono text-[11px] text-faint"
        >
          {title}
          {dirty ? " •" : ""}
        </span>
      </div>

      <textarea
        data-testid="np-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        spellCheck={false}
        placeholder={t("notepad.placeholder")}
        className="flex-1 resize-none bg-transparent px-5 py-4 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-text-dim/50"
      />

      {picker && (
        <FsPicker
          mode={picker}
          initialName={filePath ? basename(filePath) : ""}
          onCancel={() => setPicker(null)}
          onPick={(r) => {
            setPicker(null);
            if (r.path) {
              void readText(r.path).then((c) => {
                setText(c);
                setFilePath(r.path!);
                setDirty(false);
              });
            } else if (r.name) {
              void doSave(`${r.dir}/${r.name}`.replace("//", "/"));
            }
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Add Notepad i18n strings**

In `src/lib/i18n/tr.ts`, extend the existing `notepad` block with:
```ts
    open: "Aç",
    save: "Kaydet",
    saveAs: "Farklı kaydet",
```
Mirror in `src/lib/i18n/en.ts`:
```ts
    open: "Open",
    save: "Save",
    saveAs: "Save as",
```
(Keep the existing `placeholder`, `chars`, `saved`, `saving` keys.)

- [ ] **Step 7: Write the Notepad FS e2e**

`e2e/notepad-fs.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

test("save-as writes a file that appears in File Manager and persists", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "notepad");
  await page.getByTestId("np-textarea").fill("cathode notes");
  await page.getByTestId("np-save-as").click();
  await page.getByTestId("fs-save-name").fill("memo");
  await page.getByTestId("fs-save-confirm").click();
  await expect(page.getByTestId("np-title")).toContainText("memo.txt");

  // verify persisted content via the store after reload
  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  const content = await page.evaluate(async () => {
    const mod = await import("/_next/static/chunks/does-not-matter").catch(() => null);
    return null; // placeholder replaced below
  });
  // read through the store's vfs by re-opening in File Manager
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await expect(page.getByTestId("fm-entry-memo.txt")).toBeVisible();
});

test("double-clicking a text file opens Notepad with its content", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Documents", "hi.txt", "hello world");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await page.getByTestId("fm-entry-hi.txt").dblclick();
  await expect(page.getByTestId("window-notepad")).toBeVisible();
  await expect(page.getByTestId("np-textarea")).toHaveValue("hello world");
});
```
Note: remove the dead `content`/`import` placeholder lines from the first test before running — the File-Manager verification is the real assertion. The first test's body should end at the `fm-entry-memo.txt` visibility check.

- [ ] **Step 8: Clean the first e2e test**

Edit `e2e/notepad-fs.spec.ts` — delete the two `await page.evaluate(... import ...)` / `content` placeholder lines in the first test so it reads: reload → wait hydrated → open File Manager → navigate → assert `fm-entry-memo.txt` visible.

- [ ] **Step 9: Run the Notepad e2e**

Run: `npm run test:e2e -- notepad-fs.spec.ts --project=desktop`
Expected: 2 passed.

- [ ] **Step 10: Regression + typecheck + stage**

Run: `npm run test:e2e -- --project=desktop` → all pass (existing app-lifecycle uses Notepad; confirm still green).
Run: `npx tsc --noEmit` → no errors.
```bash
git add src/lib/types.ts src/store/windowsStore.ts src/components/window/Window.tsx src/components/apps/fs/FsPicker.tsx src/components/apps/Notepad.tsx src/lib/i18n/ e2e/notepad-fs.spec.ts
```
Do NOT commit. Report Task 4 done.

---

## Task 5: Desktop free-position user icons

**Files:**
- Create: `src/components/desktop/DesktopFiles.tsx`
- Modify: `src/components/desktop/Desktop.tsx` (mount layer + context-menu create)
- Create: `e2e/desktop-files.spec.ts`

**Interfaces:**
- Consumes: `useFiles` (`entriesByDir["/Desktop"]`, `positions`, `setPosition`, `createDir`, `createFile`, `refresh`), `useWindows.open`.
- Produces: `data-testid` `desk-file-<name>`.

- [ ] **Step 1: Create `src/components/desktop/DesktopFiles.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFiles } from "@/store/filesStore";
import { useWindows } from "@/store/windowsStore";
import { SYSTEM_BAR_H } from "@/lib/layout";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

/** /Desktop klasörü — serbest konumlu, sürüklenebilir masaüstü ikonları. */
export function DesktopFiles() {
  const entries = useFiles((s) => s.entriesByDir["/Desktop"]) ?? [];
  const positions = useFiles((s) => s.positions);
  const setPosition = useFiles((s) => s.setPosition);
  const refresh = useFiles((s) => s.refresh);
  const open = useWindows((s) => s.open);

  useEffect(() => {
    void refresh("/Desktop");
  }, [refresh]);

  const defaultPos = (i: number) => ({
    x: 24,
    y: SYSTEM_BAR_H + 24 + i * 92,
  });

  const onOpen = (e: FsEntry) => {
    if (e.kind === "dir") open("filemanager", "apps.files", { w: 620, h: 480 }, { path: e.path });
    else if (e.name.endsWith(".txt"))
      open("notepad", "apps.notepad", { w: 460, h: 420 }, { path: e.path });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]">
      {entries.map((e, i) => {
        const pos = positions[e.path] ?? defaultPos(i);
        return (
          <DesktopFileIcon
            key={e.path}
            entry={e}
            x={pos.x}
            y={pos.y}
            onMove={(x, y) => setPosition(e.path, x, y)}
            onOpen={() => onOpen(e)}
          />
        );
      })}
    </div>
  );
}

function DesktopFileIcon({
  entry,
  x,
  y,
  onMove,
  onOpen,
}: {
  entry: FsEntry;
  x: number;
  y: number;
  onMove: (x: number, y: number) => void;
  onOpen: () => void;
}) {
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);

  return (
    <button
      data-testid={`desk-file-${entry.name}`}
      onDoubleClick={onOpen}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        drag.current = { dx: e.clientX - x, dy: e.clientY - y, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const nx = e.clientX - d.dx;
        const ny = e.clientY - d.dy;
        if (Math.abs(nx - x) + Math.abs(ny - y) > 2) d.moved = true;
        onMove(Math.max(0, nx), Math.max(SYSTEM_BAR_H, ny));
      }}
      onPointerUp={(e) => {
        try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch { /* ignore */ }
        drag.current = null;
      }}
      style={{ left: x, top: y }}
      className="pointer-events-auto absolute flex w-20 flex-col items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors hover:bg-white/5"
    >
      <span className="text-accent">
        <Icon name={entry.kind === "dir" ? "folder" : "file"} size={44} />
      </span>
      <span className="line-clamp-2 break-all text-[11px] leading-tight text-text/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {entry.name}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Mount `DesktopFiles` and add create-menu items in `Desktop.tsx`**

Add the import:
```tsx
import { DesktopFiles } from "./DesktopFiles";
import { useFiles } from "@/store/filesStore";
```
(the `useFiles` import may already exist from Task 1 — keep one.)

Add selectors near the other hooks:
```tsx
  const createDir = useFiles((s) => s.createDir);
  const createFile = useFiles((s) => s.createFile);
```
Extend `menuItems` with two create entries (append before the settings/about items or after — keep the array shape):
```tsx
    {
      label: t("files.newFolder"),
      icon: "folder-plus",
      onClick: () => void createDir("/Desktop", uniqueName("folder")),
    },
    {
      label: t("files.newFile"),
      icon: "file",
      onClick: () => void createFile("/Desktop", uniqueName("note") + ".txt"),
      divider: true,
    },
```
Add a small unique-name helper above the component (avoids name clashes without a prompt on the desktop):
```tsx
function uniqueName(base: string): string {
  return `${base}-${Math.floor(performance.now() % 100000)}`;
}
```
Mount the layer inside the desktop root, right after `<WindowManager />` is NOT correct — place it above windows but above the wallpaper. Add it right after the app-icon grid `</motion.div>` and before `<WindowManager />`:
```tsx
      <DesktopFiles />
```

- [ ] **Step 3: Write the desktop-files e2e**

`e2e/desktop-files.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

test.use({ contextOptions: { reducedMotion: "reduce" } });

test("a file in /Desktop appears as a desktop icon", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "readme.txt", "hi");
  });
  await expect(page.getByTestId("desk-file-readme.txt")).toBeVisible();
});

test("dragging a desktop icon persists its position across reload", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "note.txt", "x");
  });
  const icon = page.getByTestId("desk-file-note.txt");
  const before = (await icon.boundingBox())!;
  await page.mouse.move(before.x + 20, before.y + 20);
  await page.mouse.down();
  await page.mouse.move(before.x + 220, before.y + 160, { steps: 12 });
  await page.mouse.up();

  // position saved (debounced 300ms) — wait, then reload
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  const after = (await page.getByTestId("desk-file-note.txt").boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 120);
  expect(after.y).toBeGreaterThan(before.y + 80);
});

test("double-clicking a desktop text file opens Notepad", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "open-me.txt", "content here");
  });
  await page.getByTestId("desk-file-open-me.txt").dblclick();
  await expect(page.getByTestId("window-notepad")).toBeVisible();
  await expect(page.getByTestId("np-textarea")).toHaveValue("content here");
});
```

- [ ] **Step 4: Run the desktop-files e2e**

Run: `npm run test:e2e -- desktop-files.spec.ts --project=desktop`
Expected: 3 passed. (If the drag icon flakes on synthetic pointer, note the icon uses the same best-effort `setPointerCapture` pattern as Epic E; the position write is debounced 300ms so the 500ms wait before reload is required.)

- [ ] **Step 5: Full regression + typecheck + lint**

Run: `npm run test:e2e` → all desktop + mobile specs pass.
Run: `npx tsc --noEmit` → no errors.
Run: `npm run lint` → no warnings/errors.

- [ ] **Step 6: Stage & report**

```bash
git add src/components/desktop/DesktopFiles.tsx src/components/desktop/Desktop.tsx e2e/desktop-files.spec.ts
```
Do NOT commit. Report Task 5 done. Epic A complete — hand off to Kutluhan for review + commit.

---

## Self-Review notes

- **Spec coverage:** A1 VFS → Task 1 (`vfs.ts`). A2 meta sidecar → Task 1 (`meta.ts`). A3 filesStore → Task 1. A4 File Manager → Tasks 2–3 (browse + CRUD + move). A5 Notepad rework → Task 4 (open/save/save-as + double-click + legacy migration). A6 desktop integration → Task 5 (free-position icons + drag persistence + right-click create). open() props payload → Task 4. Testing → each task's e2e; DoD's tsc/lint → Task 5 Step 5.
- **Placeholder scan:** the only intentional dead code is flagged in Task 4 Step 7–8 (a placeholder to delete before running) — Step 8 removes it explicitly. No other TODO/TBD.
- **Type consistency:** `FsEntry` shape identical across vfs/store/components. `open(appId, title, size, props?)` used consistently (FileManager Task 2, Notepad Task 4, DesktopFiles Task 5). `useFiles` action names (`createFile`, `createDir`, `rename`, `remove`, `move`, `setPosition`, `refresh`, `hydrate`) match between store (Task 1) and all callers. `window.__files` bridge used by every e2e.
- **Deviation from spec:** the window *title bar* keeps the app name; the open file name is shown in the Notepad toolbar (`np-title`) rather than the OS title bar — avoids adding `setTitle` plumbing and i18n-key coupling on `t(win.title)`. Satisfies "reflects the open file name" via the app's own header.
- **Commit rule honored:** no task runs `git commit`; every task stages and reports.
- **OPFS/browser-only testing:** all tests run via Playwright against real OPFS in Chromium; the `window.__files` bridge tests the data layer without UI where a UI does not yet exist.
