# Epic B — Seamless v86 Auto Sleep/Resume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make an emulator window save its running state automatically on close/minimize and resume it automatically on reopen, with no manual clicks.

**Architecture:** Extract session orchestration into a pure `emuSession.ts` module over the existing `persist.ts` OPFS store (`cathode-states/`). `EmulatorWindow` wires auto-save into its unmount cleanup and auto-resume into its ready handler. `persist.ts` and `emuSession.ts` expose `window.__persist` / `window.__emuSession` test bridges so the logic is covered with a fake engine — no v86 boot required.

**Tech Stack:** Next.js 14, TypeScript strict, v86 (WASM), OPFS, `@playwright/test`.

## Global Constraints

- **No git commit / push / branch by the agent.** Kutluhan commits (project `CLAUDE.md`). Each task ends by **staging** (`git add`) and reporting — never `git commit`.
- TypeScript strict; match existing style and Turkish-comment convention.
- No silent fallbacks (teardown best-effort save is the one documented exception); no new runtime deps.
- Keep emulator isolation intact (no `net_device`).
- Session key stays `v86-<os.id>` (matches the current `stateKey`).
- e2e selectors use `data-testid`; deterministic tests use `window.__persist` / `window.__emuSession` bridges (attached at module top-level, loaded when the emulator chunk loads — open `os-kolibri` to load it).

---

## File Structure

**New:** `src/lib/emu/emuSession.ts`, `e2e/emu-session.spec.ts`.
**Modified:** `src/lib/persist.ts` (`window.__persist` bridge), `src/components/apps/emulator/EmulatorWindow.tsx` (auto wire + controls + ready testid), `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts`.

---

## Task 1: Session module + test bridges + deterministic tests

**Files:**
- Create: `src/lib/emu/emuSession.ts`
- Modify: `src/lib/persist.ts`
- Create: `e2e/emu-session.spec.ts`

**Interfaces:**
- Produces: `SessionEngine` interface; `saveSession`, `resumeSession`, `hasSession`, `dropSession`; `window.__persist` and `window.__emuSession` bridges.

- [ ] **Step 1: Create `src/lib/emu/emuSession.ts`**

```ts
"use client";

import { writeState, readState, hasState, deleteState } from "@/lib/persist";

/** v86 durum kaydı için minimal engine arayüzü (test edilebilirlik için enjekte edilir). */
export interface SessionEngine {
  saveState(): Promise<ArrayBuffer | null>;
  restoreState(state: ArrayBuffer): Promise<void>;
}

/** Engine'in mevcut durumunu key altında kaydet. Başarılıysa true. */
export async function saveSession(
  engine: SessionEngine,
  key: string,
): Promise<boolean> {
  const state = await engine.saveState();
  if (!state) return false;
  return writeState(key, state);
}

/** Kayıtlı durumu engine'e geri yükle. Durum varsa ve uygulandıysa true. */
export async function resumeSession(
  engine: SessionEngine,
  key: string,
): Promise<boolean> {
  const state = await readState(key);
  if (!state) return false;
  await engine.restoreState(state);
  return true;
}

export async function hasSession(key: string): Promise<boolean> {
  return hasState(key);
}

export async function dropSession(key: string): Promise<void> {
  await deleteState(key);
}

// Test/debug köprüsü — Playwright e2e fake engine ile mantığı sürebilir (client-only).
if (typeof window !== "undefined") {
  (
    window as unknown as {
      __emuSession?: {
        saveSession: typeof saveSession;
        resumeSession: typeof resumeSession;
        hasSession: typeof hasSession;
        dropSession: typeof dropSession;
      };
    }
  ).__emuSession = { saveSession, resumeSession, hasSession, dropSession };
}
```

- [ ] **Step 2: Add the `window.__persist` bridge to `persist.ts`**

Append to the end of `src/lib/persist.ts`:
```ts
// Test/debug köprüsü — OPFS durum deposunu e2e'den doğrudan sürmek için (client-only).
if (typeof window !== "undefined") {
  (
    window as unknown as {
      __persist?: {
        writeState: typeof writeState;
        readState: typeof readState;
        hasState: typeof hasState;
        deleteState: typeof deleteState;
      };
    }
  ).__persist = { writeState, readState, hasState, deleteState };
}
```

- [ ] **Step 3: Write the deterministic e2e**

`e2e/emu-session.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Open the emulator so its chunk (persist + emuSession bridges) loads, then wipe state. */
async function loadEmuChunk(page: import("@playwright/test").Page) {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "os-kolibri");
  await page.waitForFunction(
    () => !!(window as any).__emuSession && !!(window as any).__persist,
  );
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("cathode-states", { recursive: true });
    } catch {
      /* nothing to remove */
    }
  });
}

test("persist round-trip: write, read, has, delete", async ({ page }) => {
  await loadEmuChunk(page);
  const result = await page.evaluate(async () => {
    const p = (window as any).__persist;
    const buf = new Uint8Array([9, 8, 7, 6]).buffer;
    await p.writeState("t1", buf);
    const has = await p.hasState("t1");
    const read = await p.readState("t1");
    const bytes = read ? Array.from(new Uint8Array(read)) : null;
    await p.deleteState("t1");
    const hasAfter = await p.hasState("t1");
    return { has, bytes, hasAfter };
  });
  expect(result.has).toBe(true);
  expect(result.bytes).toEqual([9, 8, 7, 6]);
  expect(result.hasAfter).toBe(false);
});

test("emuSession save + resume round-trips through a fake engine", async ({ page }) => {
  await loadEmuChunk(page);
  const result = await page.evaluate(async () => {
    const s = (window as any).__emuSession;
    const bytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const saver = { async saveState() { return bytes; }, async restoreState() {} };
    const saved = await s.saveSession(saver, "sess");
    const has = await s.hasSession("sess");
    let restoredLen = -1;
    const loader = {
      async saveState() { return null; },
      async restoreState(b: ArrayBuffer) { restoredLen = b.byteLength; },
    };
    const resumed = await s.resumeSession(loader, "sess");
    await s.dropSession("sess");
    const hasAfter = await s.hasSession("sess");
    return { saved, has, resumed, restoredLen, hasAfter };
  });
  expect(result.saved).toBe(true);
  expect(result.has).toBe(true);
  expect(result.resumed).toBe(true);
  expect(result.restoredLen).toBe(5);
  expect(result.hasAfter).toBe(false);
});

test("resumeSession returns false when nothing is saved", async ({ page }) => {
  await loadEmuChunk(page);
  const resumed = await page.evaluate(async () => {
    const s = (window as any).__emuSession;
    const loader = { async saveState() { return null; }, async restoreState() {} };
    return s.resumeSession(loader, "missing-key");
  });
  expect(resumed).toBe(false);
});
```

- [ ] **Step 4: Run the deterministic e2e**

Run: `npm run test:e2e -- emu-session.spec.ts --project=desktop`
Expected: 3 passed. (These do not wait for v86 to boot — only for the chunk/bridges to load.)

- [ ] **Step 5: Typecheck & stage**

Run: `npx tsc --noEmit` → no errors.
```bash
git add src/lib/emu/emuSession.ts src/lib/persist.ts e2e/emu-session.spec.ts
```
Do NOT commit. Report Task 1 done.

---

## Task 2: Wire auto-resume + auto-save into EmulatorWindow

**Files:**
- Modify: `src/components/apps/emulator/EmulatorWindow.tsx`
- Modify: `src/lib/i18n/tr.ts`, `src/lib/i18n/en.ts`
- Create: `e2e/emu-autosave.spec.ts`

**Interfaces:**
- Consumes: `saveSession`, `resumeSession`, `hasSession`, `dropSession` (Task 1); `V86Engine`.

- [ ] **Step 1: Add i18n keys**

In `src/lib/i18n/tr.ts`, in the `emulator` block add:
```ts
    resuming: "devam ediliyor…",
    newSession: "yeni oturum",
```
Mirror in `src/lib/i18n/en.ts` `emulator` block:
```ts
    resuming: "resuming…",
    newSession: "new session",
```
(The existing `sleep`/`sleeping`/`savedSession`/`resume`/`drop` keys may remain unused.)

- [ ] **Step 2: Rewrite `EmulatorWindow.tsx`**

Replace the whole file with:
```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { V86Engine, type EmuPhase } from "@/lib/emu/v86Engine";
import type { OsDefinition } from "@/data/os";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";
import {
  saveSession,
  resumeSession,
  hasSession,
  dropSession,
} from "@/lib/emu/emuSession";

interface Props {
  os: OsDefinition;
  /** BYOI: kullanıcının yüklediği imaj (yalnız client'ta, sunucuya gitmez) */
  override?: ArrayBuffer;
}

export function EmulatorWindow({ os, override }: Props) {
  const t = useT();
  const screenRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<V86Engine | null>(null);
  const [phase, setPhase] = useState<EmuPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  // OPFS anahtarı — BYOI dahil os.id bazlı
  const stateKey = `v86-${os.id}`;

  // otomatik uyku/devam koordinasyonu
  const reachedReadyRef = useRef(false);
  const willResumeRef = useRef(false);
  const resumedRef = useRef(false);

  // ready + kayıtlı oturum ikisi de hazır olunca bir kez geri yükle
  const maybeResume = useCallback(() => {
    if (
      !reachedReadyRef.current ||
      !willResumeRef.current ||
      resumedRef.current ||
      !engineRef.current
    )
      return;
    resumedRef.current = true;
    setResuming(true);
    void resumeSession(engineRef.current, stateKey).finally(() =>
      setResuming(false),
    );
  }, [stateKey]);

  // mount: kayıtlı oturum var mı?
  useEffect(() => {
    void hasSession(stateKey).then((v) => {
      willResumeRef.current = v;
      maybeResume();
    });
  }, [stateKey, maybeResume]);

  useEffect(() => {
    if (!screenRef.current) return;
    // Start bir tick geciktirilir: React StrictMode mount→cleanup→mount döngüsünde
    // aynı DOM container'da iki V86 örneğinin yarışmasını önler.
    let engine: V86Engine | null = null;
    const timer = setTimeout(() => {
      if (!screenRef.current) return;
      engine = new V86Engine({
        onPhase: (p) => {
          setPhase(p);
          if (p === "ready") {
            reachedReadyRef.current = true;
            maybeResume();
          }
        },
        onError: setError,
        onProgress: (loaded, total) =>
          setProgress(Math.round((loaded / total) * 100)),
      });
      engineRef.current = engine;
      engine.start(screenRef.current, os, override);
    }, 60);

    return () => {
      clearTimeout(timer);
      const e = engine;
      engineRef.current = null;
      // otomatik uyku: kapat/küçült öncesi durumu kaydet, sonra yok et
      void (async () => {
        try {
          if (e && reachedReadyRef.current) {
            await saveSession(e, stateKey);
          }
        } catch {
          /* teardown best-effort — kayıt başarısız olsa da yıkımı engelleme */
        }
        await e?.destroy();
      })();
    };
    // os.id / override değişince yeniden kur
  }, [os, override, stateKey, maybeResume]);

  const reset = () => engineRef.current?.restart();

  const newSession = async () => {
    willResumeRef.current = false;
    resumedRef.current = true; // yeni oturumda tekrar resume etme
    await dropSession(stateKey);
    engineRef.current?.restart();
  };

  const fullscreen = () => {
    screenRef.current?.requestFullscreen?.().catch(() => {});
  };

  const download = async () => {
    const state = await engineRef.current?.saveState();
    if (!state) return;
    const blob = new Blob([state], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${os.id}-state.bin`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loading = phase === "downloading" || phase === "booting" || resuming;

  return (
    <div className="flex h-full flex-col bg-black">
      {/* kontrol çubuğu */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-soft bg-surface/80 px-3 py-1.5">
        <span className="font-mono text-[11px] text-accent">{os.glyph}</span>
        <span className="text-[12px] text-text">{os.name}</span>
        <span
          data-testid="emu-status"
          data-phase={phase}
          className={cn(
            "ml-1 h-1.5 w-1.5 rounded-full",
            phase === "ready"
              ? "bg-accent"
              : phase === "error"
                ? "bg-[#ff5f56]"
                : "bg-text-dim",
          )}
        />
        <div className="ml-auto flex items-center gap-1">
          <Ctl onClick={reset}>{t("emulator.reset")}</Ctl>
          <Ctl onClick={newSession} disabled={phase !== "ready"}>
            {t("emulator.newSession")}
          </Ctl>
          <Ctl onClick={download} disabled={phase !== "ready"}>
            {t("emulator.download")}
          </Ctl>
          <Ctl onClick={fullscreen}>{t("emulator.fullscreen")}</Ctl>
        </div>
      </div>

      {/* ekran */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={screenRef}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black",
            phase === "ready" && !resuming && "cursor-none",
          )}
        >
          <div
            style={{
              whiteSpace: "pre",
              font: "14px monospace",
              lineHeight: "14px",
              color: "#fff",
            }}
          />
          <canvas style={{ display: "none" }} />
        </div>

        {/* yükleme / hata kaplaması */}
        {(loading || phase === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-void/90 backdrop-blur">
            {phase === "error" ? (
              <>
                <span className="text-danger">
                  <Icon name="close" size={26} />
                </span>
                <p className="text-sm text-text">
                  {error ? t(error) : t("emulator.error")}
                </p>
                <Ctl onClick={() => location.reload()}>{t("common.retry")}</Ctl>
              </>
            ) : (
              <>
                <span className="phosphor animate-pulse text-accent">
                  <Icon name="disk" size={30} />
                </span>
                <p className="font-mono text-xs text-text-dim">
                  {resuming
                    ? t("emulator.resuming")
                    : phase === "downloading"
                      ? t("emulator.hintDownloading")
                      : phase === "booting"
                        ? t("emulator.hintBooting")
                        : t("emulator.preparing")}
                </p>
                {phase === "downloading" && !resuming && (
                  <div className="h-px w-48 overflow-hidden bg-border">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ekranı bırak ipucu */}
        {phase === "ready" && !resuming && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-void/70 px-3 py-1 font-mono text-[10px] text-text-dim">
            {t("emulator.captureHint")}
          </div>
        )}
      </div>
    </div>
  );
}

function Ctl({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-[6px] border border-border px-2 py-1 font-mono text-[10px] text-text-dim transition-colors hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-dim"
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`persist` import is no longer used directly in EmulatorWindow — confirm no unused-import lint error in Step 6.)

- [ ] **Step 4: Write the real-boot smoke e2e**

`e2e/emu-autosave.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// booting a real VM is slow — give it room
test.setTimeout(90_000);

test("closing a ready emulator auto-saves its session to OPFS", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  // clean any prior saved state
  await openAppFromDesktop(page, "os-kolibri");
  await page.waitForFunction(() => !!(window as any).__persist);
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("cathode-states", { recursive: true });
    } catch {
      /* none */
    }
  });
  // wait for the emulator to reach ready
  await expect(page.locator('[data-testid="emu-status"][data-phase="ready"]')).toBeVisible(
    { timeout: 60_000 },
  );
  // close the emulator window → auto-save on unmount
  await page.getByTestId("window-close-os-kolibri").click();
  // the saved state file should now exist in OPFS
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const p = (window as any).__persist;
          return p ? p.hasState("v86-kolibri") : false;
        }),
      { timeout: 10_000 },
    )
    .toBe(true);
});
```

- [ ] **Step 5: Run the smoke e2e**

Run: `npm run test:e2e -- emu-autosave.spec.ts --project=desktop`
Expected: 1 passed.

**If it fails because v86 never reaches `ready` in headless** (SharedArrayBuffer / COEP / asset issues): investigate once (check `page.on("console")` and the `emu-status` phase). If the VM genuinely cannot boot in this headless environment, DELETE `e2e/emu-autosave.spec.ts` and record in the task report that the smoke test was removed for environment reasons — the feature then rests on Task 1's deterministic tests plus manual verification. Do NOT weaken the assertion to make it pass.

- [ ] **Step 6: Full regression + typecheck + lint**

Run: `npm run test:e2e` → all specs pass (or all except a removed smoke, per Step 5).
Run: `npx tsc --noEmit` → no errors.
Run: `npm run lint` → no warnings/errors (fix any unused-import from the removed `persist` usage).

- [ ] **Step 7: Stage & report**

```bash
git add src/components/apps/emulator/EmulatorWindow.tsx src/lib/i18n/tr.ts src/lib/i18n/en.ts e2e/emu-autosave.spec.ts
```
Do NOT commit. Report Task 2 done. Epic B complete — hand off to Kutluhan for review + commit.

---

## Self-Review notes

- **Spec coverage:** B1 session module → Task 1 (`emuSession.ts`). B2 auto-resume → Task 2 (`maybeResume`, ready handler, `resuming` overlay). B3 auto-save on close/minimize → Task 2 (cleanup save-then-destroy; minimize unmounts too). B4 controls → Task 2 (Sleep removed, New session added, Reset = restart, Download/Fullscreen kept). Testing → Task 1 deterministic (persist + fake-engine) + Task 2 smoke. DoD tsc/lint → Task 2 Step 6.
- **Deviation from spec:** spec said "Reset now also drops the saved session"; the plan keeps Reset a pure `restart()` and puts the drop-saved behavior in the dedicated **New session** control (clearer separation — Reset = reboot current, New session = forget + fresh). Auto-save on the next close re-persists whatever is running, so no stale-state hazard.
- **Placeholder scan:** none. The smoke-test removal in Task 2 Step 5 is a conditional, explicitly-logged decision, not a silent gap.
- **Type consistency:** `SessionEngine` matches `V86Engine`'s `saveState`/`restoreState`. `saveSession`/`resumeSession`/`hasSession`/`dropSession` signatures identical between Task 1 definition and Task 2 usage. Bridge names `__persist` / `__emuSession` consistent across module and tests. `stateKey` format `v86-<os.id>` unchanged.
- **Commit rule honored:** no `git commit`; each task stages and reports.
