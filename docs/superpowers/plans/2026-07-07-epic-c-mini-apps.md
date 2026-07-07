# Epic C — Mini Apps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans / subagent-driven-development. Checkbox steps.

**Goal:** Add Calculator, Image Viewer, and Paint mini apps plus binary VFS support so images live in the filesystem.

**Architecture:** Extend `vfs.ts` with `writeBlob`/`readBlob` and a byte-based `copyRec`; `filesStore` gets a `writeBlob` action. Three new apps registered in `apps.ts`. A shared `src/lib/fs/kind.ts` routes files to the right app (`.txt`→Notepad, images→Image Viewer) across File Manager, desktop, and pickers.

**Tech Stack:** Next.js 14, TypeScript strict, Tailwind, OPFS, Canvas 2D, `@playwright/test`.

## Global Constraints

- No git commit/branch by the agent — Kutluhan commits. Each task stages + reports.
- TypeScript strict; Turkish comments; no new deps; no silent fallbacks.
- e2e via `data-testid` + `window.__files` bridge.

---

## Task 1: Binary VFS + store writeBlob

**Files:** Modify `src/lib/fs/vfs.ts`, `src/store/filesStore.ts`. Create `e2e/binary-fs.spec.ts`.

**Interfaces produced:** `vfs.writeBlob(path, data)`, `vfs.readBlob(path)`; `filesStore.writeBlob(dir, name, data): Promise<string>`.

- [ ] **Step 1: Add `writeBlob`/`readBlob` and byte `copyRec` to `vfs.ts`**

Add after `readText`:
```ts
export async function writeBlob(
  path: string,
  data: Blob | ArrayBuffer,
): Promise<void> {
  await dirHandle(parent(path), true);
  const fh = await fileHandle(path, true);
  const ws = await fh.createWritable();
  await ws.write(data);
  await ws.close();
}

export async function readBlob(path: string): Promise<Blob> {
  const fh = await fileHandle(path, false);
  return fh.getFile();
}
```
Replace `copyRec`'s file branch to copy bytes (works for text and binary):
```ts
async function copyRec(srcPath: string, destPath: string): Promise<void> {
  const st = await stat(srcPath);
  if (!st) throw new Error(`source not found: ${srcPath}`);
  if (st.kind === "dir") {
    await mkdir(destPath);
    for (const child of await list(srcPath)) {
      await copyRec(child.path, normalize(destPath + "/" + child.name));
    }
  } else {
    const bytes = await (await readBlob(srcPath)).arrayBuffer();
    await writeBlob(destPath, bytes);
  }
}
```

- [ ] **Step 2: Add `writeBlob` action to `filesStore.ts`**

Add to the interface and implementation (near `createFile`):
```ts
  writeBlob: (dir: string, name: string, data: Blob) => Promise<string>;
```
```ts
  writeBlob: async (dir, name, data) => {
    const path = normalize(dir + "/" + name);
    await vfs.writeBlob(path, data);
    await get().refresh(dir);
    return path;
  },
```
Import stays `import * as vfs from "@/lib/fs/vfs";` (already).

- [ ] **Step 3: Write binary FS e2e**

`e2e/binary-fs.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("writes and reads a binary file, preserving bytes", async ({ page }) => {
  await resetFs(page);
  const size = await page.evaluate(async (b64) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });
    const f = (window as any).__files.getState();
    await f.writeBlob("/Pictures", "dot.png", blob);
    const mod = await import("/_skip").catch(() => null);
    void mod;
    // read back via the store's vfs through a fresh entry check + refresh
    await f.refresh("/Pictures");
    const entry = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "dot.png");
    return entry ? entry.size : -1;
  }, PNG_B64);
  expect(size).toBeGreaterThan(0);
});

test("renaming a binary file preserves its content", async ({ page }) => {
  await resetFs(page);
  const same = await page.evaluate(async (b64) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const f = (window as any).__files.getState();
    await f.writeBlob("/Pictures", "a.png", new Blob([arr], { type: "image/png" }));
    await f.refresh("/Pictures");
    const before = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "a.png").size;
    await f.rename("/Pictures/a.png", "b.png");
    await f.refresh("/Pictures");
    const after = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "b.png").size;
    return before === after && after === arr.length;
  }, PNG_B64);
  expect(same).toBe(true);
});
```
(Delete the dead `import("/_skip")` line before running — it is a no-op placeholder.)

- [ ] **Step 4: Clean the dead import line**, then run:
Run: `npm run test:e2e -- binary-fs.spec.ts --project=desktop`
Expected: 2 passed.

- [ ] **Step 5: Typecheck & stage**
`npx tsc --noEmit` → clean. `git add src/lib/fs/vfs.ts src/store/filesStore.ts e2e/binary-fs.spec.ts`. Report.

---

## Task 2: Calculator

**Files:** Create `src/components/apps/Calculator.tsx`. Modify `src/data/apps.ts`, i18n. Create part of `e2e/mini-apps.spec.ts`.

- [ ] **Step 1: Create `Calculator.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Op = "+" | "−" | "×" | "÷";

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true); // next digit starts a new number

  const inputDigit = useCallback((d: string) => {
    setDisplay((cur) => (fresh || cur === "0" ? d : cur + d));
    setFresh(false);
  }, [fresh]);

  const inputDot = useCallback(() => {
    setDisplay((cur) => (fresh ? "0." : cur.includes(".") ? cur : cur + "."));
    setFresh(false);
  }, [fresh]);

  const clear = useCallback(() => {
    setDisplay("0"); setAcc(null); setOp(null); setFresh(true);
  }, []);

  const chooseOp = useCallback((next: Op) => {
    const val = parseFloat(display);
    if (acc === null) setAcc(val);
    else if (op) setAcc((a) => (a === null ? val : apply(a, val, op)));
    setOp(next); setFresh(true);
  }, [display, acc, op]);

  const equals = useCallback(() => {
    if (op === null || acc === null) return;
    const val = parseFloat(display);
    const res = apply(acc, val, op);
    setDisplay(Number.isFinite(res) ? String(res) : "hata");
    setAcc(null); setOp(null); setFresh(true);
  }, [op, acc, display]);

  const negate = () => setDisplay((c) => (c.startsWith("-") ? c.slice(1) : c === "0" ? c : "-" + c));
  const percent = () => setDisplay((c) => String(parseFloat(c) / 100));
  const backspace = () => setDisplay((c) => (c.length > 1 ? c.slice(0, -1) : "0"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDot();
      else if (e.key === "+") chooseOp("+");
      else if (e.key === "-") chooseOp("−");
      else if (e.key === "*") chooseOp("×");
      else if (e.key === "/") { e.preventDefault(); chooseOp("÷"); }
      else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Escape") clear();
      else if (e.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDot, chooseOp, equals, clear]);

  const Key = ({ label, on, wide, accent }: { label: string; on: () => void; wide?: boolean; accent?: boolean }) => (
    <button
      data-testid={`calc-key-${label}`}
      onClick={on}
      className={cn(
        "flex items-center justify-center rounded-btn py-3 font-mono text-lg transition-colors",
        wide && "col-span-2",
        accent ? "bg-accent text-accent-ink hover:brightness-110" : "bg-surface-2 text-text hover:bg-surface-3",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col gap-2 bg-surface-0 p-3">
      <div
        data-testid="calc-display"
        className="flex items-center justify-end rounded-ui bg-black/40 px-4 py-4 font-mono text-3xl tabular-nums text-text"
      >
        {display}
      </div>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        <Key label="C" on={clear} />
        <Key label="±" on={negate} />
        <Key label="%" on={percent} />
        <Key label="÷" on={() => chooseOp("÷")} accent />
        <Key label="7" on={() => inputDigit("7")} />
        <Key label="8" on={() => inputDigit("8")} />
        <Key label="9" on={() => inputDigit("9")} />
        <Key label="×" on={() => chooseOp("×")} accent />
        <Key label="4" on={() => inputDigit("4")} />
        <Key label="5" on={() => inputDigit("5")} />
        <Key label="6" on={() => inputDigit("6")} />
        <Key label="−" on={() => chooseOp("−")} accent />
        <Key label="1" on={() => inputDigit("1")} />
        <Key label="2" on={() => inputDigit("2")} />
        <Key label="3" on={() => inputDigit("3")} />
        <Key label="+" on={() => chooseOp("+")} accent />
        <Key label="0" on={() => inputDigit("0")} wide />
        <Key label="." on={inputDot} />
        <Key label="=" on={equals} accent />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register + i18n**
In `apps.ts` import `Calculator` and add app `{ id:"calculator", name:"apps.calculator", glyph:"=", description:"apps.calculatorDesc", component: Calculator, defaultSize:{w:280,h:400}, minSize:{w:260,h:360}, pinned:true }`.
Add i18n `apps.calculator`/`apps.calculatorDesc` in tr (`Hesap makinesi`/`Aritmetik`) and en (`Calculator`/`Arithmetic`).

- [ ] **Step 3: Calculator e2e** (append to `e2e/mini-apps.spec.ts`, created here):
```ts
import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

test("calculator computes with mouse", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "calculator");
  await page.getByTestId("calc-key-7").click();
  await page.getByTestId("calc-key-×").click();
  await page.getByTestId("calc-key-6").click();
  await page.getByTestId("calc-key-=").click();
  await expect(page.getByTestId("calc-display")).toHaveText("42");
});

test("calculator computes with keyboard", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "calculator");
  await page.keyboard.press("2");
  await page.keyboard.press("+");
  await page.keyboard.press("3");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("calc-display")).toHaveText("5");
});
```

- [ ] **Step 4: Run** `npm run test:e2e -- mini-apps.spec.ts --project=desktop` → calculator tests pass. tsc clean. Stage. Report.

---

## Task 3: Image Viewer + image routing

**Files:** Create `src/components/apps/ImageViewer.tsx`, `src/lib/fs/kind.ts`. Modify `apps.ts`, `FileManager.tsx`, `DesktopFiles.tsx`, `FsPicker.tsx`, i18n. Extend `e2e/mini-apps.spec.ts`.

- [ ] **Step 1: `src/lib/fs/kind.ts`** (shared routing):
```ts
import type { FsEntry } from "./types";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

export function isImage(name: string): boolean {
  return IMAGE_EXT.test(name);
}
export function isText(name: string): boolean {
  return /\.txt$/i.test(name);
}

type OpenFn = (
  appId: string,
  title: string,
  size: { w: number; h: number },
  props?: Record<string, unknown>,
) => string;

/** Route a file entry to the right app on open (double-click). */
export function openFile(open: OpenFn, entry: FsEntry): void {
  if (entry.kind !== "file") return;
  if (isImage(entry.name))
    open("imageviewer", "apps.viewer", { w: 640, h: 480 }, { path: entry.path });
  else if (isText(entry.name))
    open("notepad", "apps.notepad", { w: 460, h: 420 }, { path: entry.path });
}
```

- [ ] **Step 2: `ImageViewer.tsx`**:
```tsx
"use client";

import { useEffect, useState } from "react";
import { readBlob } from "@/lib/fs/vfs";
import { useT } from "@/lib/i18n/useT";

interface Props {
  windowId: string;
  path?: string;
}

export function ImageViewer({ path }: Props) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) { setUrl(null); return; }
    let revoked: string | null = null;
    let cancelled = false;
    void readBlob(path).then((blob) => {
      if (cancelled) return;
      const u = URL.createObjectURL(blob);
      revoked = u;
      setUrl(u);
    });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [path]);

  if (!url) {
    return (
      <div data-testid="viewer-empty" className="flex h-full items-center justify-center bg-black/60 p-6 text-center font-mono text-xs text-text-dim">
        {t("viewer.empty")}
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-black/80 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-testid="viewer-img" src={url} alt="" className="max-h-full max-w-full object-contain [image-rendering:pixelated]" />
    </div>
  );
}
```

- [ ] **Step 3: Register + i18n**: `apps.ts` add `{ id:"imageviewer", name:"apps.viewer", glyph:"▨", description:"apps.viewerDesc", component: ImageViewer, defaultSize:{w:640,h:480}, minSize:{w:360,h:280}, pinned:false }`. i18n `apps.viewer`/`apps.viewerDesc` (tr `Görüntüleyici`/`Resim görüntüleyici`; en `Viewer`/`Image viewer`) and `viewer.empty` (tr `görüntülenecek resim yok`; en `no image to display`).

- [ ] **Step 4: Route images in FileManager/DesktopFiles**: replace their inline `.txt`/open logic with `openFile(open, entry)` from `kind.ts`.
  - `FileManager.tsx` `onOpenEntry`: for `dir` keep `setDir`; for file call `openFile(open, e)`.
  - `DesktopFiles.tsx` `onOpen`: for `dir` open filemanager; for file call `openFile(open, e)`.

- [ ] **Step 5: Image Viewer + routing e2e** (append to `mini-apps.spec.ts`):
```ts
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function seedPng(page: import("@playwright/test").Page, name: string) {
  await page.evaluate(async ({ b64, name }) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    await (window as any).__files
      .getState()
      .writeBlob("/Pictures", name, new Blob([arr], { type: "image/png" }));
  }, { b64: PNG_B64, name });
}

test("double-clicking an image opens the Image Viewer", async ({ page }) => {
  await resetFs(page);
  await seedPng(page, "pic.png");
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Pictures").dblclick();
  await page.getByTestId("fm-entry-pic.png").dblclick();
  await expect(page.getByTestId("window-imageviewer")).toBeVisible();
  const nat = await page.getByTestId("viewer-img").evaluate((el) => (el as HTMLImageElement).naturalWidth);
  expect(nat).toBeGreaterThan(0);
});
```

- [ ] **Step 6: Run** mini-apps.spec.ts → all pass. tsc clean. Stage. Report.

---

## Task 4: Paint

**Files:** Create `src/components/apps/Paint.tsx`. Modify `apps.ts`, i18n. Extend `e2e/mini-apps.spec.ts`.

- [ ] **Step 1: `Paint.tsx`**:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";

const W = 480;
const H = 320;
const COLORS = ["#f59e0b", "#22c55e", "#e5e7eb", "#3b82f6", "#ef4444", "#111318"];
const SIZES: Record<string, number> = { S: 2, M: 5, L: 12 };

export function Paint() {
  const t = useT();
  const writeBlob = useFiles((s) => s.writeBlob);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState("M");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.fillStyle = "#0a0a0c"; ctx.fillRect(0, 0, W, H); }
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const stroke = (to: { x: number; y: number }) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = color;
    ctx.lineWidth = SIZES[size];
    ctx.lineCap = "round";
    ctx.beginPath();
    const from = last.current ?? to;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  };

  const clear = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, W, H);
    setSaved(null);
  };

  const save = () => {
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return;
      const name = `paint-${Math.floor(performance.now() % 100000)}.png`;
      await writeBlob("/Pictures", name, blob);
      setSaved(name);
    }, "image/png");
  };

  return (
    <div className="flex h-full flex-col bg-surface-0">
      <div className="flex items-center gap-2 border-b border-border-soft px-2 py-1.5">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              data-testid={`paint-color-${c}`}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={cn("h-5 w-5 rounded-full border", color === c ? "border-accent" : "border-border-soft")}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {Object.keys(SIZES).map((s) => (
            <button
              key={s}
              data-testid={`paint-size-${s}`}
              onClick={() => setSize(s)}
              className={cn("h-6 w-6 rounded-btn font-mono text-[11px]", size === s ? "bg-accent text-accent-ink" : "bg-surface-2 text-text-dim")}
            >
              {s}
            </button>
          ))}
        </div>
        <button data-testid="paint-clear" onClick={clear} className="ml-auto rounded-btn px-2 py-1 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text">
          {t("paint.clear")}
        </button>
        <button data-testid="paint-save" onClick={save} className="rounded-btn bg-accent px-2 py-1 font-mono text-[11px] text-accent-ink">
          {t("paint.save")}
        </button>
        {saved && <span data-testid="paint-saved" className="font-mono text-[10px] text-faint">{saved}</span>}
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/50 p-2">
        <canvas
          ref={canvasRef}
          data-testid="paint-canvas"
          width={W}
          height={H}
          onPointerDown={(e) => { drawing.current = true; last.current = null; stroke(pos(e)); }}
          onPointerMove={(e) => { if (drawing.current) stroke(pos(e)); }}
          onPointerUp={() => { drawing.current = false; last.current = null; }}
          onPointerLeave={() => { drawing.current = false; last.current = null; }}
          className="max-h-full max-w-full touch-none bg-[#0a0a0c] [image-rendering:pixelated]"
          style={{ aspectRatio: `${W}/${H}` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register + i18n**: `apps.ts` add `{ id:"paint", name:"apps.paint", glyph:"✎", description:"apps.paintDesc", component: Paint, defaultSize:{w:560,h:460}, minSize:{w:420,h:360}, pinned:true }`. i18n `apps.paint`/`apps.paintDesc` (tr `Paint`/`Çiz ve kaydet`; en `Paint`/`Draw and save`), `paint.clear`/`paint.save` (tr `temizle`/`kaydet`; en `clear`/`save`).

- [ ] **Step 3: Paint e2e** (append to `mini-apps.spec.ts`):
```ts
test("paint draws a stroke and saves a PNG into /Pictures", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "paint");
  const canvas = page.getByTestId("paint-canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 120, { steps: 10 });
  await page.mouse.up();
  await page.getByTestId("paint-save").click();
  await expect(page.getByTestId("paint-saved")).toBeVisible();
  // the file exists in /Pictures
  const has = await page.evaluate(async () => {
    const f = (window as any).__files.getState();
    await f.refresh("/Pictures");
    return (window as any).__files.getState().entriesByDir["/Pictures"].some((e: any) => /^paint-.*\.png$/.test(e.name));
  });
  expect(has).toBe(true);
});
```

- [ ] **Step 4: Run** full `mini-apps.spec.ts` → all pass. tsc clean. Stage. Report.

---

## Task 5: Full regression

- [ ] **Step 1:** `npm run test:e2e` → all pass (desktop + mobile).
- [ ] **Step 2:** `npx tsc --noEmit` → clean. `npm run lint` → clean.
- [ ] **Step 3:** Stage all + report. Epic C complete.

## Self-Review notes

- **Coverage:** C1 binary VFS → Task 1. C2 Calculator → Task 2. C3 Image Viewer → Task 3. C4 Paint → Task 4. C5 routing → Task 3 (`kind.ts` + call-site edits). Tests each task; regression Task 5.
- **Types:** `writeBlob(dir,name,data)` store action consistent (Paint, viewer tests). `readBlob`/`writeBlob` vfs signatures consistent. `openFile(open, entry)` used in FileManager + DesktopFiles. App ids: `calculator`, `imageviewer`, `paint`. i18n keys added in both dicts.
- **Deviations:** FsPicker `accept` predicate deferred — the viewer is opened via double-click routing (has a path), so the no-path picker path is not needed this epic; ImageViewer's no-path state shows an empty message. Notepad routing left as-is (already routes .txt). copyRec now byte-based (fixes binary rename/move — covered by Task 1 test 2).
- **Placeholders:** Task 1 Step 3 has one dead `import("/_skip")` line explicitly removed in Step 4.
- **Commit rule:** no git commit; stage + report per task.
