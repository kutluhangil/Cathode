# Epic A — Virtual Filesystem + File Manager + Desktop Persistence (Design)

> Date: 2026-07-07
> Part of the Cathode post-Phase-3 improvement program (order: E → **A** → B → C → D → F).
> Epic E (testing + mobile + a11y) is complete. This is Epic A.
> Each epic gets its own spec → plan → build cycle.

## Program context

Cathode is a browser-native retro OS shell (Next.js 14, TypeScript strict, Tailwind,
Framer Motion, Zustand; privacy-first, no server, browser-only persistence). Epic A adds
the foundational filesystem layer that later epics (B save-state, C mini-apps) build on.

## Goal

Three deliverables, one epic:

1. **Hierarchical virtual filesystem** backed by OPFS (real nested files/folders).
2. **File Manager app** — browse, create, rename, delete, move files and folders.
3. **Desktop persistence** — the `/Desktop` folder renders as free-position, draggable
   desktop icons whose positions persist; Notepad reads/writes real files.

## Architecture decision

**OPFS is the content source of truth; a Zustand store mirrors a reactive tree for the
UI; icon positions live in an OPFS JSON metadata sidecar.**

- VFS root directory: `cathode-fs/` under the OPFS root — separate from the existing
  `cathode-states/` used by `src/lib/persist.ts` for v86 save-states.
- The store holds an in-memory snapshot for reactive rendering (desktop icons, File
  Manager); every mutation calls the async VFS then refreshes the snapshot.
- Rejected alternatives: (2) localStorage JSON tree — 5 MB cap, contradicts the "real
  files" direction, dual-model once binary lands; (3) pure OPFS with no mirror — async
  everywhere, reactivity is janky.

This matches the existing `persist.ts` OPFS direction and is binary-ready for Epic C
(Paint/image files).

## Current state (verified against code)

- `src/lib/persist.ts` — OPFS wrapper for flat `.bin` blobs in `cathode-states/` (v86
  save-states). Not hierarchical; leave it untouched.
- `src/components/apps/Notepad.tsx` — stores to a single localStorage key
  `cathode.notepad`. No file concept.
- Desktop icons come from the static `APPS` registry (`src/data/apps.ts`), rendered by
  `src/components/desktop/Desktop.tsx` in a fixed grid. No user files.
- `windowsStore.open(appId, title, size)` — no per-window props payload.
- Existing UI primitives: `Button`, `ContextMenu` (already viewport-clamped), `AppIcon`.
- i18n: `src/lib/i18n/{tr,en}.ts` with `useT()`.

## A1 — VFS module (`src/lib/fs/vfs.ts`)

Pure async functions wrapping OPFS, path-based (POSIX-style, e.g. `/Desktop/notes.txt`).

Types (in `src/lib/fs/types.ts`):
```ts
export type FsKind = "file" | "dir";
export interface FsEntry {
  name: string;      // "notes.txt"
  path: string;      // "/Desktop/notes.txt"
  kind: FsKind;
  size: number;      // bytes (0 for dirs)
  modified: number;  // epoch ms (file.lastModified; 0 for dirs)
}
```

Functions:
- `isSupported(): boolean` — OPFS availability.
- `list(path: string): Promise<FsEntry[]>` — immediate children.
- `readText(path: string): Promise<string>`
- `writeText(path: string, content: string): Promise<void>` — creates parent dirs as needed.
- `mkdir(path: string): Promise<void>` — creates the dir (and parents).
- `remove(path: string): Promise<void>` — recursive for dirs.
- `rename(path: string, newName: string): Promise<string>` — returns the new path.
- `move(srcPath: string, destDir: string): Promise<string>` — returns the new path.
- `exists(path: string): Promise<boolean>`
- `stat(path: string): Promise<FsEntry | null>`

Behavior:
- If OPFS is unsupported, `isSupported()` returns false and callers surface a UI notice;
  the mutating functions throw an explicit `Error("OPFS not supported")` (no silent
  fallback — project rule).
- `rename`/`move` are implemented as copy-to-new + remove-old within OPFS (OPFS has no
  native move); for dirs this recurses.
- Path helpers (`join`, `parent`, `basename`, normalize) live in `src/lib/fs/path.ts`.

Seeding: `ensureSeed()` creates `/Desktop`, `/Documents`, `/Pictures` if the root is
empty (first run). Called once during store hydration.

## A2 — Metadata sidecar (`src/lib/fs/meta.ts`)

File `cathode-fs/.cathode-meta.json`, shape:
```ts
export interface FsMeta {
  positions: Record<string, { x: number; y: number }>; // keyed by file path
}
```
- `readMeta(): Promise<FsMeta>` — returns `{ positions: {} }` if missing/corrupt.
- `writeMeta(meta: FsMeta): Promise<void>` — debounced by the store.
- When a path is removed or moved, the store deletes/rekeys its position entry.
- The `.`-prefixed name keeps it out of normal `list()` results (filter dotfiles).

## A3 — filesStore (`src/store/filesStore.ts`)

Zustand store, reactive mirror:
```ts
interface FilesState {
  supported: boolean;
  hydrated: boolean;
  entriesByDir: Record<string, FsEntry[]>; // dir path -> children (cache)
  positions: Record<string, { x: number; y: number }>;
  hydrate: () => Promise<void>;             // ensureSeed + load /Desktop + meta
  refresh: (dir: string) => Promise<void>;  // reload one dir's children
  createFile: (dir: string, name: string, content?: string) => Promise<string>;
  createDir: (dir: string, name: string) => Promise<string>;
  rename: (path: string, newName: string) => Promise<string>;
  remove: (path: string) => Promise<void>;
  move: (srcPath: string, destDir: string) => Promise<string>;
  setPosition: (path: string, x: number, y: number) => void; // debounced writeMeta
}
```
- Mutations call the VFS, then `refresh` affected dirs, then update state.
- `setPosition` updates state immediately and debounces `writeMeta`.
- Desktop reads `entriesByDir["/Desktop"]`; File Manager reads the current dir's cache.

## A4 — File Manager app (`src/components/apps/FileManager.tsx`)

New app added to the `APPS` registry (`pinned: true`, glyph e.g. `▤`). Single-pane
browser with a breadcrumb path:
- **Toolbar:** breadcrumb (`/ › Documents › …`) with clickable segments, an up button,
  and "New folder" / "New file" buttons.
- **Body:** icon/list of the current dir's entries. Double-click: folder → navigate into
  it; text file → open in Notepad (via `open("notepad", …, { path })`).
- **Item actions** (context menu on an entry): Rename (inline input), Delete (confirm),
  and Move (choose a destination folder from a simple picker of existing dirs).
- **States:** empty folder, and an "OPFS unavailable" notice when `!supported`.
- Uses existing `Button`, `ContextMenu`, `AppIcon`; full TR/EN i18n via `useT()`.
- Internal navigation state (`currentDir`) is component-local; the store owns data.

## A5 — Notepad rework (`src/components/apps/Notepad.tsx`)

From a single localStorage key to real files:
- Receives `windowId` and optional `path` prop (the file to open on launch).
- **Toolbar:** Open (a file picker over the VFS), Save, Save As (choose folder + name).
- Window title reflects the open file name (or "Untitled"); an unsaved-changes indicator.
- Open-file + dirty state is per window instance (component-local, seeded from `path`).
- Double-clicking a text file (desktop or File Manager) launches Notepad with that `path`.
- **One-time migration:** on first hydrate, if legacy `localStorage["cathode.notepad"]`
  has content and `/Documents/notlar.txt` does not exist, write it there and clear the
  legacy key.

## A6 — Desktop integration (`src/components/desktop/Desktop.tsx` + new `DesktopFiles.tsx`)

- The `/Desktop` folder's entries render as icons in a **separate free-position layer**
  above the wallpaper, alongside (not replacing) the existing fixed app-icon grid.
- Each user icon is draggable; on drop, `setPosition(path, x, y)` persists to the OPFS
  meta sidecar (debounced). Icons without a stored position get an auto-placed default
  (simple grid fallback) until first moved.
- Double-click: folder → open File Manager at that path; text file → open Notepad.
- The desktop's right-click `ContextMenu` gains "New folder" and "New text file" (created
  in `/Desktop`).
- The existing app-icon grid and its layout are unchanged.

New component `src/components/desktop/DesktopFiles.tsx` owns the free-position user-icon
layer to keep `Desktop.tsx` focused.

## Store change — `open()` props payload

`windowsStore.open(appId, title, size)` gains an optional 4th arg:
```ts
open: (appId, title, size, props?: Record<string, unknown>) => string;
```
- `WindowInstance` gains `props?: Record<string, unknown>`.
- `Window` passes `win.props` into the app `Body` (spread alongside `windowId`).
- `AppDefinition.component` prop type widens to `{ windowId: string } & Record<string, unknown>`.
- Existing callers (no 4th arg) are unaffected. `toggleFromDock` still opens without props.

## Testing (Playwright e2e — Epic E pattern)

`e2e/filesystem.spec.ts`, running against real OPFS in Chromium:
- `beforeEach`: `bypassBoot`, then wipe `cathode-fs` via
  `navigator.storage.getDirectory().removeEntry("cathode-fs", { recursive: true })`
  (init script before load) so each test starts clean.
- File Manager: open → create folder → navigate in → create file → rename → delete.
- Notepad: type → Save As into `/Documents` → appears in File Manager → reload → content
  persists.
- Desktop: create a file in `/Desktop` → icon appears → drag it → reload → position
  persists.
- Double-click a text file → Notepad opens with its content.

Stable `data-testid`s are added on File Manager entries, toolbar buttons, and desktop
user icons (following Epic E's i18n-independent selector convention).

## Definition of Done

- Hierarchical FS persists in OPFS; files, folders, and desktop icon positions survive
  reload.
- File Manager: create/rename/delete/move + breadcrumb navigation all work.
- Notepad: open / save / save-as, and double-click-to-open with content.
- Desktop: free-position user icons with persisted positions; right-click create.
- `npm run test:e2e` green (desktop + mobile projects unaffected); `npx tsc --noEmit`
  and `npm run lint` clean.

## Files (anticipated)

- New: `src/lib/fs/vfs.ts`, `src/lib/fs/types.ts`, `src/lib/fs/path.ts`,
  `src/lib/fs/meta.ts`, `src/store/filesStore.ts`,
  `src/components/apps/FileManager.tsx`, `src/components/desktop/DesktopFiles.tsx`,
  `e2e/filesystem.spec.ts`.
- Modified: `src/data/apps.ts` (register File Manager; widen component prop type),
  `src/lib/types.ts` (`AppDefinition.component`, `WindowInstance.props`),
  `src/store/windowsStore.ts` (`open` props arg),
  `src/components/window/Window.tsx` (pass `win.props` to Body),
  `src/components/apps/Notepad.tsx` (FS rework),
  `src/components/desktop/Desktop.tsx` (mount `DesktopFiles`, context-menu create),
  `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts` (File Manager + Notepad strings).

## Constraints

- No git commit / push / branch by the agent — Kutluhan commits (project `CLAUDE.md`).
- TypeScript strict; match existing style and Turkish-comment convention.
- No silent fallbacks — OPFS-unsupported surfaces an explicit UI notice / thrown error.
- No new runtime dependencies (OPFS + Zustand already present).
