# Epic C — Mini Apps (Calculator, Image Viewer, Paint) Design

> Date: 2026-07-07
> Program order: E → A → B → **C** → D → F. E, A, B complete.
> Scope decided autonomously (user delegated: "sıradan devam et sana bırakıyorum").

## Goal

Add three mini apps that make the shell feel like a real desktop, plus the binary
filesystem support they need:

1. **Calculator** — standalone retro calculator (arithmetic + keyboard).
2. **Image Viewer** — opens image files (`.png/.jpg/.jpeg/.gif/.webp`) from the VFS.
3. **Paint** — canvas drawing, saves `.png` into `/Pictures`.
4. **Binary VFS** — `writeBlob`/`readBlob` so images live in the filesystem; `copyRec`
   becomes byte-based so rename/move work for any file type.

Non-goals (YAGNI): Music player, layers, image zoom/pan, undo history, brush textures,
scientific-calculator functions.

## Current state (from Epic A)

- `src/lib/fs/vfs.ts` — text-only (`writeText`/`readText`); `copyRec` copies via
  `readText`/`writeText` (would corrupt binary on rename/move).
- `src/store/filesStore.ts` — `createFile` (text), `window.__files` bridge.
- App registration in `src/data/apps.ts`; `open(appId, title, size, props?)` payload.
- Double-click routing: `.txt` → Notepad in `FileManager.tsx`, `DesktopFiles.tsx`,
  `FsPicker.tsx`. Images currently do nothing.
- Icons in `src/components/icons/index.tsx`.

## C1 — Binary VFS

In `src/lib/fs/vfs.ts`:
- `writeBlob(path: string, data: Blob | ArrayBuffer): Promise<void>` — ensures parents,
  writes bytes via OPFS `createWritable`.
- `readBlob(path: string): Promise<Blob>` — returns the file (a `File` is a `Blob`).
- Refactor `copyRec` to copy raw bytes (read the file, write its `ArrayBuffer`) instead
  of text — preserves both text and binary content; fixes rename/move for images.

In `src/store/filesStore.ts`:
- `writeBlob(dir: string, name: string, data: Blob): Promise<string>` — writes then
  refreshes the dir; returns the path. (Text creation keeps `createFile`.)

## C2 — Calculator (`src/components/apps/Calculator.tsx`)

- Standalone; no FS. Register app id `calculator`, glyph e.g. `▦`... use a distinct glyph.
- Display + buttons: digits, `+ − × ÷`, `=`, `C` (clear), `±`, `%`, `.`.
- Keyboard support (digits, operators, Enter `=`, Escape/`C` clear, Backspace).
- Pure evaluation (no `eval`): a small operand/operator state machine.
- `data-testid`s: `calc-key-<label>`, `calc-display`.

## C3 — Image Viewer (`src/components/apps/ImageViewer.tsx`)

- Props: `{ windowId, path? }`. On mount with `path`, `readBlob(path)` →
  `URL.createObjectURL` → `<img>`; revoke on unmount / path change.
- No path: an "open" picker (reuse `FsPicker` in `open` mode, but it currently filters
  `.txt` — extend `FsPicker` to accept an `accept` predicate so it can pick images).
- Empty / unsupported states. `data-testid`: `viewer-img`, `viewer-empty`.
- Register app id `imageviewer`.

## C4 — Paint (`src/components/apps/Paint.tsx`)

- Props: `{ windowId }`. An HTML `<canvas>` fixed logical size (e.g. 480×320), pointer
  drawing (freehand line), a small toolbar: a few accent-friendly colors, brush sizes
  (S/M/L), Clear, and Save.
- Save: `canvas.toBlob("image/png")` → `filesStore.writeBlob("/Pictures",
  "paint-<uniq>.png", blob)`; then it appears in File Manager / Pictures, openable in the
  Image Viewer.
- `data-testid`s: `paint-canvas`, `paint-save`, `paint-clear`, `paint-color-<c>`.
- Register app id `paint`.

## C5 — Image routing

Route image files to the Image Viewer everywhere a `.txt` routes to Notepad:
- `FileManager.tsx` `onOpenEntry`, `DesktopFiles.tsx` `onOpen`, `FsPicker.tsx` (open
  mode when used by the viewer).
- Shared helper `src/lib/fs/kind.ts`: `isImage(name)`, `isText(name)`, and
  `openFile(open, entry)` that picks the right app — keeps routing DRY across the three
  call sites.

## Testing (Playwright e2e, bridges)

- **Binary VFS** — via `window.__files`: `writeBlob` a small PNG byte array, `readBlob`
  back, assert bytes/size; rename a binary file and assert content survives (byte copy).
- **Calculator** — open app, click `7 × 6 =`, assert display `42`; keyboard `2+3=` → `5`.
- **Image Viewer** — write a 1×1 PNG to `/Pictures` via bridge, open viewer with that
  path (via `open` props from File Manager double-click), assert `viewer-img` has a
  non-empty `src` and natural size > 0.
- **Paint** — open, draw a stroke (pointer events on canvas), Save, assert a
  `paint-*.png` appears in `/Pictures` (via bridge `entriesByDir`), and it opens in the
  viewer.
- **Routing** — double-click a `.png` in File Manager opens `imageviewer`, not Notepad.

`data-testid` selectors throughout (i18n-independent). Store bridge used for setup where a
UI does not yet exist.

## Definition of Done

- Calculator computes correctly (mouse + keyboard).
- Paint draws and saves a real PNG into `/Pictures`; it opens in the Image Viewer.
- Image files route to the viewer from File Manager, desktop, and pickers.
- Binary VFS round-trips; rename/move preserve binary content.
- e2e green; `npx tsc --noEmit` and `npm run lint` clean; existing suite unaffected.

## Files (anticipated)

- New: `src/components/apps/Calculator.tsx`, `src/components/apps/ImageViewer.tsx`,
  `src/components/apps/Paint.tsx`, `src/lib/fs/kind.ts`,
  `e2e/mini-apps.spec.ts`, `e2e/binary-fs.spec.ts`.
- Modified: `src/lib/fs/vfs.ts` (writeBlob/readBlob/byte copyRec),
  `src/store/filesStore.ts` (writeBlob action), `src/data/apps.ts` (register 3 apps),
  `src/components/icons/index.tsx` (calculator/paint/image icons as needed),
  `src/components/apps/FileManager.tsx`, `src/components/desktop/DesktopFiles.tsx`,
  `src/components/apps/fs/FsPicker.tsx` (image routing / accept predicate),
  `src/components/apps/Notepad.tsx` (use shared `openFile` where relevant — optional),
  `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts` (app names + strings).

## Constraints

- No git commit/branch by the agent — Kutluhan commits.
- TypeScript strict; match style + Turkish comments; no new runtime deps; no silent
  fallbacks (OPFS-unsupported already surfaces via `filesStore.supported`).
