# Epic E — Testing + Mobile + a11y Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Playwright e2e safety net over the existing shell, a mobile single-fullscreen-window mode, and an accessibility baseline (focus trap, Esc-to-close, ARIA roles) — before later epics modify the window manager.

**Architecture:** Tests drive the real UI (never internal store state). Mobile mode lives entirely in the presentation layer via a `useIsMobile()` hook; `windowsStore` is untouched. a11y adds a `useFocusTrap` hook plus per-window keyboard handling and ARIA roles on existing components. Stable `data-testid` / `data-*` attributes are added so selectors do not couple to TR/EN i18n strings.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, Zustand, Framer Motion, `@playwright/test`.

## Global Constraints

- **No git commit / push / branch by the agent.** Kutluhan performs every commit (project `CLAUDE.md`). Each task ends by **staging** changes (`git add`) and reporting done — never `git commit`.
- TypeScript strict; match existing code style and Turkish-comment convention.
- New runtime deps require a one-line justification. Only new dep here: `@playwright/test` (devDependency) — the chosen e2e test runner.
- Breakpoint for mobile mode: `max-width: 767px`.
- Layout constants come from `src/lib/layout.ts`: `SYSTEM_BAR_H = 28`, `DOCK_RESERVE = 84`. Maximized/fullscreen windows leave the system bar and dock visible (top offset = `SYSTEM_BAR_H + 6`).
- Boot shows once per session via `sessionStorage["cathode.booted"]` (`BOOT_KEY`). Non-boot tests bypass it by seeding that key before load.
- Settings persist to `localStorage["cathode.settings"]` (zustand persist, version 3).
- Stable anchors that are NOT i18n-coupled: boot text `"Cathode Systems 5100"`, terminal prompt `"guest@cathode:~$"`, and the `data-testid`s added by this plan.

---

## File Structure

**New files:**
- `playwright.config.ts` — Playwright config (webServer, projects, baseURL).
- `e2e/helpers.ts` — shared boot bypass + open-app helpers.
- `e2e/boot.spec.ts` — boot flow.
- `e2e/app-lifecycle.spec.ts` — open/close/minimize/maximize/focus.
- `e2e/window-manipulation.spec.ts` — drag/resize/snap/bounds.
- `e2e/shell-flows.spec.ts` — switcher, terminal, settings persistence, command palette.
- `e2e/mobile.spec.ts` — mobile single-window mode.
- `e2e/a11y.spec.ts` — focus trap, Esc-close, roles.
- `src/lib/useIsMobile.ts` — matchMedia hook.
- `src/lib/useFocusTrap.ts` — focus trap hook.

**Modified files:**
- `package.json` — dep + `test:e2e` scripts.
- `.gitignore` — ignore Playwright output.
- `src/components/desktop/DesktopIcon.tsx` — `data-testid`.
- `src/components/dock/Dock.tsx` — `data-testid`, `role="toolbar"`.
- `src/components/window/Window.tsx` — `data-testid`, `mobile` prop, focus trap, Esc-close.
- `src/components/window/TitleBar.tsx` — `mobile` prop (disable drag), `data-testid` on close button.
- `src/components/window/ResizeHandles.tsx` — `data-resize-dir`.
- `src/components/window/WindowManager.tsx` — mobile single-window branch.
- `src/components/window/WindowSwitcher.tsx` — `role="listbox"` / `option`.
- `src/components/desktop/CommandPalette.tsx` — `data-testid` on input.
- `src/data/apps.ts` — `capturesKeyboard` on emulator/game apps.
- `src/lib/types.ts` — `capturesKeyboard?` on `AppDefinition`.

---

## Task 1: Playwright setup + boot flow

**Files:**
- Modify: `package.json`, `.gitignore`
- Create: `playwright.config.ts`, `e2e/helpers.ts`, `e2e/boot.spec.ts`

**Interfaces:**
- Produces: `e2e/helpers.ts` exports `bypassBoot(page)` and `openAppFromDesktop(page, appId)` used by later specs.

- [ ] **Step 1: Install Playwright**

Run:
```bash
npm install -D @playwright/test
npx playwright install chromium
```
Expected: `@playwright/test` added to `devDependencies`; chromium downloaded.

- [ ] **Step 2: Add test scripts to `package.json`**

Add to the `scripts` block (keep existing scripts):
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 3: Ignore Playwright output**

Append to `.gitignore`:
```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/.playwright/
```

- [ ] **Step 4: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 667 } },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Create `e2e/helpers.ts`**

```ts
import type { Page } from "@playwright/test";

/** Seed the boot flag before load so the desktop renders immediately. */
export async function bypassBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("cathode.booted", "1");
    } catch {
      /* storage unavailable — ignore */
    }
  });
}

/** Open an app by clicking its desktop icon (single click opens). */
export async function openAppFromDesktop(page: Page, appId: string) {
  await page.getByTestId(`desktop-icon-${appId}`).click();
}
```

- [ ] **Step 6: Write the boot flow test**

`e2e/boot.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test.describe("boot", () => {
  test("shows boot sequence then transitions to desktop on click", async ({ page }) => {
    await page.goto("/");
    // BIOS banner is hardcoded English — stable anchor
    await expect(page.getByText("Cathode Systems 5100")).toBeVisible();
    // clicking the boot overlay skips to desktop
    await page.getByRole("button", { name: /skip|atla/i }).click();
    await expect(page.getByText("Cathode Systems 5100")).toHaveCount(0);
  });

  test("boot shown once per session", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /skip|atla/i }).click();
    await page.reload();
    // second load in same session: no boot banner
    await expect(page.getByText("Cathode Systems 5100")).toHaveCount(0);
  });
});
```

- [ ] **Step 7: Run the boot test**

Run: `npm run test:e2e -- boot.spec.ts --project=desktop`
Expected: 2 passed. (If the skip button name assertion fails, inspect the boot overlay `aria-label` and adjust the regex — the overlay has `role="button"` with an i18n `boot.skipAria` label; the overlay itself is clickable, so `page.locator('[role="button"][aria-label]').first().click()` is an acceptable fallback.)

- [ ] **Step 8: Stage & report**

```bash
git add package.json .gitignore playwright.config.ts e2e/
```
Do NOT commit — Kutluhan commits. Report Task 1 done.

---

## Task 2: App lifecycle e2e + instrumentation

**Files:**
- Modify: `src/components/desktop/DesktopIcon.tsx`, `src/components/dock/Dock.tsx`, `src/components/window/Window.tsx`, `src/components/window/TitleBar.tsx`
- Create: `e2e/app-lifecycle.spec.ts`

**Interfaces:**
- Produces: `data-testid="desktop-icon-<appId>"` (desktop icons), `data-testid="dock-app-<appId>"` (dock buttons), `data-testid="window-<appId>"` (window root), `data-testid="window-close-<appId>"` (close button). Consumed by all later specs.

- [ ] **Step 1: Add `data-testid` to `DesktopIcon`**

In `src/components/desktop/DesktopIcon.tsx`, add to the `<button>` (alongside `aria-label`):
```tsx
      data-testid={`desktop-icon-${app.id}`}
```

- [ ] **Step 2: Add `data-testid` to `Dock` app buttons**

In `src/components/dock/Dock.tsx`, on the app `<button key={a.id}>`, add:
```tsx
              data-testid={`dock-app-${a.id}`}
```

- [ ] **Step 3: Add `data-testid` to `Window` root**

In `src/components/window/Window.tsx`, on the `<motion.div role="dialog" ...>`, add:
```tsx
      data-testid={`window-${win.appId}`}
```

- [ ] **Step 4: Add `data-testid` to the close button**

In `src/components/window/TitleBar.tsx`, extend `WinBtn` with an optional `testId` prop and pass it on the close button.

Change the `WinBtn` signature and element:
```tsx
function WinBtn({
  label,
  icon,
  onClick,
  className,
  testId,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex h-[22px] w-[22px] items-center justify-center rounded-btn text-text-dim transition-colors duration-150 hover:bg-surface-3 hover:text-text",
        className,
      )}
    >
      <Icon name={icon} size={12} />
    </button>
  );
}
```
And on the close `WinBtn` usage add: `testId={`window-close-${win.appId}`}`.

- [ ] **Step 5: Write the app lifecycle test**

`e2e/app-lifecycle.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
});

test("open from desktop icon shows a window", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await expect(page.getByTestId("window-notepad")).toBeVisible();
});

test("close removes the window", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await page.getByTestId("window-close-notepad").click();
  await expect(page.getByTestId("window-notepad")).toHaveCount(0);
});

test("dock toggles the same app window", async ({ page }) => {
  await page.getByTestId("dock-app-terminal").click();
  await expect(page.getByTestId("window-terminal")).toBeVisible();
});

test("focus order: clicking a window raises it above another", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await openAppFromDesktop(page, "about");
  const notepad = page.getByTestId("window-notepad");
  const about = page.getByTestId("window-about");
  // click notepad to focus it
  await notepad.click();
  const zNotepad = await notepad.evaluate((el) => Number(getComputedStyle(el).zIndex));
  const zAbout = await about.evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(zNotepad).toBeGreaterThan(zAbout);
});
```

- [ ] **Step 6: Run the lifecycle tests**

Run: `npm run test:e2e -- app-lifecycle.spec.ts --project=desktop`
Expected: 4 passed.

- [ ] **Step 7: Stage & report**

```bash
git add src/components/desktop/DesktopIcon.tsx src/components/dock/Dock.tsx src/components/window/Window.tsx src/components/window/TitleBar.tsx e2e/app-lifecycle.spec.ts
```
Do NOT commit. Report Task 2 done.

---

## Task 3: Window manipulation e2e

**Files:**
- Modify: `src/components/window/ResizeHandles.tsx`
- Create: `e2e/window-manipulation.spec.ts`

**Interfaces:**
- Consumes: `data-testid="window-<appId>"` (Task 2).
- Produces: `data-resize-dir="<dir>"` on each resize handle.

- [ ] **Step 1: Add `data-resize-dir` to handles**

In `src/components/window/ResizeHandles.tsx`, add the attribute to the handle `<div>`:
```tsx
        <div
          key={h.dir}
          data-resize-dir={h.dir}
          className={`absolute z-20 ${h.cls}`}
          onPointerDown={start(h.dir)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
```

- [ ] **Step 2: Write the manipulation test**

`e2e/window-manipulation.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "notepad");
});

async function box(page: import("@playwright/test").Page) {
  return (await page.getByTestId("window-notepad").boundingBox())!;
}

test("drag by title bar moves the window", async ({ page }) => {
  const before = await box(page);
  // grab the title bar (top strip of the window) and drag right+down
  await page.mouse.move(before.x + 60, before.y + 4);
  await page.mouse.down();
  await page.mouse.move(before.x + 260, before.y + 154, { steps: 8 });
  await page.mouse.up();
  const after = await box(page);
  expect(after.x).toBeGreaterThan(before.x + 100);
  expect(after.y).toBeGreaterThan(before.y + 80);
});

test("resize handle grows the window", async ({ page }) => {
  const before = await box(page);
  const handle = page.getByTestId("window-notepad").locator('[data-resize-dir="se"]');
  const hb = (await handle.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + 120, hb.y + 120, { steps: 8 });
  await page.mouse.up();
  const after = await box(page);
  expect(after.width).toBeGreaterThan(before.width + 60);
  expect(after.height).toBeGreaterThan(before.height + 60);
});

test("drag to left edge snaps to half screen", async ({ page }) => {
  const before = await box(page);
  await page.mouse.move(before.x + 60, before.y + 4);
  await page.mouse.down();
  // release at the far-left edge (clientX <= 12 triggers snap)
  await page.mouse.move(4, 300, { steps: 10 });
  await page.mouse.up();
  const after = await box(page);
  const vw = page.viewportSize()!.width;
  expect(after.x).toBeLessThanOrEqual(2);
  expect(after.width).toBeGreaterThan(vw * 0.4);
  expect(after.width).toBeLessThan(vw * 0.6);
});

test("window stays within viewport bounds when dragged off-screen", async ({ page }) => {
  const before = await box(page);
  await page.mouse.move(before.x + 60, before.y + 4);
  await page.mouse.down();
  await page.mouse.move(2000, 2000, { steps: 8 });
  await page.mouse.up();
  const after = await box(page);
  const vw = page.viewportSize()!.width;
  // title bar remains reachable — left never pushed fully past the right edge
  expect(after.x).toBeLessThan(vw - 100);
});
```

- [ ] **Step 3: Run the manipulation tests**

Run: `npm run test:e2e -- window-manipulation.spec.ts --project=desktop`
Expected: 4 passed. (If drag does not register, confirm the title bar strip is the top ~32px of the window; the drag start Y offset `+4` targets it.)

- [ ] **Step 4: Stage & report**

```bash
git add src/components/window/ResizeHandles.tsx e2e/window-manipulation.spec.ts
```
Do NOT commit. Report Task 3 done.

---

## Task 4: Shell flows e2e (switcher, terminal, settings persistence, command palette)

**Files:**
- Modify: `src/components/desktop/CommandPalette.tsx`
- Create: `e2e/shell-flows.spec.ts`

**Interfaces:**
- Consumes: `data-testid="window-<appId>"`.
- Produces: `data-testid="command-palette-input"` on the palette input.

- [ ] **Step 1: Add `data-testid` to the command palette input**

In `src/components/desktop/CommandPalette.tsx`, find the search `<input>` and add:
```tsx
            data-testid="command-palette-input"
```
(If the palette has no text input — verify by reading the file — locate the focusable query element and add the same `data-testid` to it.)

- [ ] **Step 2: Write the shell flows test**

`e2e/shell-flows.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
});

test("terminal 'open' command launches an app", async ({ page }) => {
  await openAppFromDesktop(page, "terminal");
  const input = page.getByTestId("window-terminal").locator("input");
  await input.click();
  await input.fill("open notepad");
  await input.press("Enter");
  await expect(page.getByTestId("window-notepad")).toBeVisible();
});

test("terminal 'accent' command persists to localStorage", async ({ page }) => {
  await openAppFromDesktop(page, "terminal");
  const input = page.getByTestId("window-terminal").locator("input");
  await input.click();
  await input.fill("accent green");
  await input.press("Enter");
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem("cathode.settings");
        return raw ? JSON.parse(raw).state.accent : null;
      }),
    )
    .toBe("green");
  // survives reload
  await page.reload();
  const accent = await page.evaluate(() => {
    const raw = localStorage.getItem("cathode.settings");
    return raw ? JSON.parse(raw).state.accent : null;
  });
  expect(accent).toBe("green");
});

test("command palette (Ctrl/Cmd+K) opens and launches an app", async ({ page }) => {
  const mod = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${mod}+KeyK`);
  const input = page.getByTestId("command-palette-input");
  await expect(input).toBeVisible();
  await input.fill("notepad");
  await input.press("Enter");
  await expect(page.getByTestId("window-notepad")).toBeVisible();
});

test("Alt+Tab window switcher appears with two windows open", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await openAppFromDesktop(page, "about");
  await page.keyboard.down("Alt");
  await page.keyboard.press("Tab");
  // switcher list is a listbox (Task 7) — but present as dialog before that task lands
  await expect(page.getByRole("dialog", { name: /switch|değiştir/i })).toBeVisible();
  await page.keyboard.up("Alt");
});
```

- [ ] **Step 3: Run the shell flows tests**

Run: `npm run test:e2e -- shell-flows.spec.ts --project=desktop`
Expected: 4 passed. (The Alt+Tab switcher assertion uses `role="dialog"` here; Task 7 changes the inner list to a listbox but keeps the outer dialog role, so this test stays green.)

- [ ] **Step 4: Stage & report**

```bash
git add src/components/desktop/CommandPalette.tsx e2e/shell-flows.spec.ts
```
Do NOT commit. Report Task 4 done.

---

## Task 5: Mobile single-fullscreen-window mode

**Files:**
- Create: `src/lib/useIsMobile.ts`, `e2e/mobile.spec.ts`
- Modify: `src/components/window/WindowManager.tsx`, `src/components/window/Window.tsx`, `src/components/window/TitleBar.tsx`

**Interfaces:**
- Produces: `useIsMobile(breakpoint?: number): boolean`.
- Consumes: `data-testid="window-<appId>"`, `data-testid="dock-app-<appId>"`, `data-resize-dir`.

- [ ] **Step 1: Write the mobile test (fails first)**

`e2e/mobile.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
});

test("window renders fullscreen with no resize handles on mobile", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  const win = page.getByTestId("window-notepad");
  const box = (await win.boundingBox())!;
  const vw = page.viewportSize()!.width;
  // fullscreen width (allow a couple px rounding)
  expect(box.width).toBeGreaterThanOrEqual(vw - 2);
  // no resize handles in mobile mode
  await expect(win.locator("[data-resize-dir]")).toHaveCount(0);
});

test("only one window visible at a time on mobile", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await openAppFromDesktop(page, "about");
  await expect(page.getByTestId("window-about")).toBeVisible();
  await expect(page.getByTestId("window-notepad")).toHaveCount(0);
});

test("dock switches the visible app on mobile", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await page.getByTestId("dock-app-terminal").click();
  await expect(page.getByTestId("window-terminal")).toBeVisible();
  await expect(page.getByTestId("window-notepad")).toHaveCount(0);
});

test("no horizontal overflow on mobile", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- --project=mobile`
Expected: FAIL — multiple windows render, resize handles present.

- [ ] **Step 3: Create `useIsMobile` hook**

`src/lib/useIsMobile.ts`:
```ts
"use client";

import { useEffect, useState } from "react";

/** True when the viewport is at or below the mobile breakpoint. SSR-safe. */
export function useIsMobile(breakpoint = 767): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
```

- [ ] **Step 4: Branch `WindowManager` for mobile**

Rewrite `src/components/window/WindowManager.tsx`:
```tsx
"use client";

import { AnimatePresence } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useIsMobile } from "@/lib/useIsMobile";
import { Window } from "./Window";

export function WindowManager() {
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  const visible = windows.filter((w) => w.status !== "minimized");

  if (isMobile) {
    // single fullscreen window: focused one, else the top-z visible one
    const top =
      visible.find((w) => w.id === focusedId) ??
      (visible.length ? visible.reduce((a, b) => (a.z > b.z ? a : b)) : null);
    return (
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {top && <Window key={top.id} win={top} active reduced={reduced} mobile />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {visible.map((w) => (
          <Window
            key={w.id}
            win={w}
            active={w.id === focusedId}
            reduced={reduced}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Add `mobile` prop to `Window`**

In `src/components/window/Window.tsx`: import layout constants, add the prop, compute style, hide resize handles, pass `mobile` to `TitleBar`.

Add import near the top:
```tsx
import { SYSTEM_BAR_H, DOCK_RESERVE } from "@/lib/layout";
```
Update the `Props` interface and signature:
```tsx
interface Props {
  win: WindowInstance;
  active: boolean;
  reduced: boolean;
  mobile?: boolean;
}

export function Window({ win, active, reduced, mobile = false }: Props) {
```
Replace the inline `style={{ ... }}` with:
```tsx
      style={
        mobile
          ? {
              left: 0,
              top: SYSTEM_BAR_H + 6,
              width: "100%",
              height: `calc(100% - ${SYSTEM_BAR_H + 6 + DOCK_RESERVE}px)`,
              zIndex: win.z,
            }
          : {
              left: win.rect.x,
              top: win.rect.y,
              width: win.rect.w,
              height: win.rect.h,
              zIndex: win.z,
            }
      }
```
Change the rounded class so mobile is square:
```tsx
        mobile || maximized ? "rounded-none" : "rounded-win",
```
Pass the prop to the title bar:
```tsx
      <TitleBar win={win} active={active} mobile={mobile} />
```
Hide resize handles on mobile:
```tsx
      {!maximized && !mobile && (
        <ResizeHandles
          start={resize.start}
          onPointerMove={resize.onPointerMove}
          onPointerUp={resize.onPointerUp}
        />
      )}
```

- [ ] **Step 6: Add `mobile` prop to `TitleBar` (disable drag)**

In `src/components/window/TitleBar.tsx`, update `Props` and the drag wiring:
```tsx
interface Props {
  win: WindowInstance;
  active: boolean;
  mobile?: boolean;
}

export function TitleBar({ win, active, mobile = false }: Props) {
```
Replace the draggable `<div onPointerDown=... onDoubleClick=...>` opening with conditional handlers:
```tsx
      <div
        onPointerDown={mobile ? undefined : move.onPointerDown}
        onPointerMove={mobile ? undefined : move.onPointerMove}
        onPointerUp={mobile ? undefined : move.onPointerUp}
        onDoubleClick={mobile ? undefined : () => toggleMaximize(win.id)}
        className={cn(
          "flex h-8 select-none items-center gap-2 px-2.5",
          mobile ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
```

- [ ] **Step 7: Run the mobile tests**

Run: `npm run test:e2e -- --project=mobile`
Expected: 4 passed.

- [ ] **Step 8: Run the desktop suite to confirm no regression**

Run: `npm run test:e2e -- --project=desktop`
Expected: all previous tests still pass.

- [ ] **Step 9: Stage & report**

```bash
git add src/lib/useIsMobile.ts src/components/window/WindowManager.tsx src/components/window/Window.tsx src/components/window/TitleBar.tsx e2e/mobile.spec.ts
```
Do NOT commit. Report Task 5 done.

---

## Task 6: a11y — focus trap, initial focus, Esc-to-close

**Files:**
- Create: `src/lib/useFocusTrap.ts`
- Modify: `src/lib/types.ts`, `src/data/apps.ts`, `src/components/window/Window.tsx`
- Create/extend: `e2e/a11y.spec.ts`

**Interfaces:**
- Produces: `useFocusTrap(ref, active)`; `AppDefinition.capturesKeyboard?: boolean`.
- Consumes: `data-testid="window-<appId>"`.

- [ ] **Step 1: Write the a11y test (focus + Esc) — fails first**

`e2e/a11y.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
});

test("Esc closes a non-emulator window", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await expect(page.getByTestId("window-notepad")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("window-notepad")).toHaveCount(0);
});

test("focus stays trapped inside the focused window on Tab", async ({ page }) => {
  await openAppFromDesktop(page, "about");
  // cycle Tab several times; active element must remain inside the window
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => {
      const win = document.querySelector('[data-testid="window-about"]');
      return !!win && win.contains(document.activeElement);
    });
    expect(inside).toBe(true);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:e2e -- a11y.spec.ts --project=desktop`
Expected: FAIL — Esc does nothing; Tab escapes the window.

- [ ] **Step 3: Add `capturesKeyboard` to the app type**

In `src/lib/types.ts`, add to `AppDefinition`:
```tsx
  /** emülatör gibi klavyeyi ele geçiren app — Esc pencereyi kapatmasın */
  capturesKeyboard?: boolean;
```

- [ ] **Step 4: Mark emulator + game apps as keyboard-capturing**

In `src/data/apps.ts`, in the `osApps` map add `capturesKeyboard: true` to each generated object, and the same in the `gameApps` map:
```tsx
const osApps: AppDefinition[] = enabledOs().map((os) => ({
  id: `os-${os.id}`,
  name: os.name,
  glyph: os.glyph,
  description: os.description,
  component: () => LazyEmulator({ os }),
  defaultSize: { w: 760, h: 560 },
  minSize: { w: 480, h: 360 },
  capturesKeyboard: true,
}));
```
```tsx
const gameApps: AppDefinition[] = enabledGames().map((g) => ({
  id: `game-${g.id}`,
  name: g.name,
  glyph: g.glyph,
  description: g.description,
  component: () => LazyJsDos({ game: g }),
  defaultSize: { w: 720, h: 540 },
  minSize: { w: 480, h: 360 },
  capturesKeyboard: true,
}));
```

- [ ] **Step 5: Create the focus trap hook**

`src/lib/useFocusTrap.ts`:
```ts
"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Odak tuzağı: pencere mount olunca kabına odaklanır; aktifken Tab pencere
 * içinde döner (Shift+Tab geri). Emülatör pencereleri kendi klavyesini yönetir.
 */
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean) {
  // mount: kaba odaklan (app içeriğiyle kavga etmesin diye ilk odak kap)
  useEffect(() => {
    ref.current?.focus();
  }, [ref]);

  // aktifken Tab döngüsü
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(
        el.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (activeEl === first || activeEl === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [ref, active]);
}
```

- [ ] **Step 6: Wire trap + Esc-close into `Window`**

In `src/components/window/Window.tsx`:

Add imports:
```tsx
import { useRef } from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";
```
Inside the component, after `const app = getApp(win.appId);` guard, add:
```tsx
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useWindows((s) => s.close);
  useFocusTrap(rootRef, active);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !app.capturesKeyboard) {
      e.stopPropagation();
      close(win.id);
    }
  };
```
On the `<motion.div role="dialog" ...>` add `ref`, `tabIndex`, and `onKeyDown`:
```tsx
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
```
(`framer-motion`'s `motion.div` forwards `ref` to the DOM node, so `rootRef` is the window element.)

- [ ] **Step 7: Run the a11y tests**

Run: `npm run test:e2e -- a11y.spec.ts --project=desktop`
Expected: 2 passed.

- [ ] **Step 8: Run the full desktop + mobile suite (regression)**

Run: `npm run test:e2e`
Expected: all pass. (Watch that Esc-close does not break the command-palette Esc: palette handles its own Esc on its own focused input, outside any window — confirm the palette test still passes.)

- [ ] **Step 9: Stage & report**

```bash
git add src/lib/useFocusTrap.ts src/lib/types.ts src/data/apps.ts src/components/window/Window.tsx e2e/a11y.spec.ts
```
Do NOT commit. Report Task 6 done.

---

## Task 7: a11y — ARIA roles (dock toolbar, switcher listbox) + focus-visible verification

**Files:**
- Modify: `src/components/dock/Dock.tsx`, `src/components/window/WindowSwitcher.tsx`
- Extend: `e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: existing `role="dialog"` on `WindowSwitcher`, dock structure.

- [ ] **Step 1: Add `role="toolbar"` to the dock**

In `src/components/dock/Dock.tsx`, on the inner container that holds the app buttons (the `<div className="pointer-events-auto flex items-center gap-1.5 ...">`), add:
```tsx
        role="toolbar"
        aria-label={t("dock.menu")}
```
(`t` is already in scope in this component.)

- [ ] **Step 2: Make the switcher a listbox**

In `src/components/window/WindowSwitcher.tsx`:

On the inner flex container `<div className="flex items-center gap-2 rounded-ui bg-surface-2 p-3 shadow-float">`, add:
```tsx
        role="listbox"
        aria-label={t("windows.switcher")}
```
On each item `<div key={w.id} ...>`, add:
```tsx
              role="option"
              aria-selected={i === index}
```

- [ ] **Step 3: Extend the a11y test with role assertions**

Append to `e2e/a11y.spec.ts`:
```ts
test("dock exposes a toolbar role", async ({ page }) => {
  await expect(page.getByRole("toolbar")).toBeVisible();
});

test("Alt+Tab switcher exposes listbox options", async ({ page }) => {
  await openAppFromDesktop(page, "notepad");
  await openAppFromDesktop(page, "about");
  await page.keyboard.down("Alt");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("listbox")).toBeVisible();
  expect(await page.getByRole("option").count()).toBeGreaterThanOrEqual(2);
  await page.keyboard.up("Alt");
});

test("focus-visible ring is applied on keyboard focus", async ({ page }) => {
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});
```

- [ ] **Step 4: Run the a11y tests**

Run: `npm run test:e2e -- a11y.spec.ts --project=desktop`
Expected: 5 passed. (The focus-visible ring is already defined globally at `src/app/globals.css:335` — `:focus-visible { outline: 1px solid var(--accent) }` — so this test verifies existing behavior; no CSS change needed.)

- [ ] **Step 5: Run the entire suite (final regression)**

Run: `npm run test:e2e`
Expected: all specs pass on both `desktop` and `mobile` projects.

- [ ] **Step 6: Typecheck & lint**

Run:
```bash
npx tsc --noEmit
npm run lint
```
Expected: no errors.

- [ ] **Step 7: Stage & report**

```bash
git add src/components/dock/Dock.tsx src/components/window/WindowSwitcher.tsx e2e/a11y.spec.ts
```
Do NOT commit. Report Task 7 done. Epic E complete — hand off to Kutluhan for review + commit.

---

## Self-Review notes

- **Spec coverage:** E1 → Tasks 1–4 (all 7 critical flows: boot, lifecycle, manipulation/snap/bounds, switcher, terminal, settings persistence, command palette). E2 → Task 5 (fullscreen, single-window, dock switch, no overflow). E3 → Tasks 6–7 (focus trap, initial focus, Esc-close with emulator guard, dock/switcher roles, focus-visible verified). Window `role="dialog"` already present.
- **Focus-visible:** already implemented in `globals.css`; plan verifies rather than re-adds (avoids duplicate rule).
- **i18n decoupling:** selectors use `data-testid` / roles / hardcoded anchors, not TR/EN display strings — safe across the live language toggle.
- **Commit rule honored:** no task runs `git commit`; every task stages and reports.
- **Type consistency:** `capturesKeyboard` defined in `types.ts` (Task 6 Step 3), consumed in `apps.ts` (Step 4) and `Window.tsx` (Step 6). `mobile` prop threaded `WindowManager → Window → TitleBar` (Task 5). `useIsMobile` / `useFocusTrap` signatures match their call sites.
