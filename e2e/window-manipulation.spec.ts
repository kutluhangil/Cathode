import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

// window geometry must be stable — disable entry animation for these drag/resize tests
test.use({ reducedMotion: "reduce" });

test.beforeEach(async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "notepad");
});

async function box(page: Page) {
  return (await page.getByTestId("window-notepad").boundingBox())!;
}

/**
 * Drive a pointer drag by dispatching real PointerEvents on the target element.
 * This bubbles into React's root listener deterministically, bypassing Playwright's
 * synthetic pointer-capture (which is lossy in headless Chromium). `path` is a list
 * of absolute viewport points: first = pointerdown, middle = moves, last = pointerup.
 */
async function drag(page: Page, selector: string, path: { x: number; y: number }[]) {
  await page.evaluate(
    ({ selector, path }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`drag: element not found: ${selector}`);
      const fire = (type: string, x: number, y: number) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            button: 0,
            buttons: type === "pointerup" ? 0 : 1,
            pointerId: 1,
            isPrimary: true,
          }),
        );
      const [start, ...moves] = path;
      fire("pointerdown", start.x, start.y);
      for (const p of moves) fire("pointermove", p.x, p.y);
      const last = path[path.length - 1];
      fire("pointerup", last.x, last.y);
    },
    { selector, path },
  );
}

const TITLEBAR = '[data-testid="titlebar-notepad"]';

test("drag by title bar moves the window", async ({ page }) => {
  const before = await box(page);
  await drag(page, TITLEBAR, [
    { x: before.x + 60, y: before.y + 4 },
    { x: before.x + 160, y: before.y + 80 },
    { x: before.x + 260, y: before.y + 154 },
  ]);
  const after = await box(page);
  expect(after.x).toBeGreaterThan(before.x + 100);
  expect(after.y).toBeGreaterThan(before.y + 80);
});

test("resize handle grows the window", async ({ page }) => {
  const before = await box(page);
  const handle = page.getByTestId("window-notepad").locator('[data-resize-dir="se"]');
  const hb = (await handle.boundingBox())!;
  await drag(page, '[data-testid="window-notepad"] [data-resize-dir="se"]', [
    { x: hb.x + hb.width / 2, y: hb.y + hb.height / 2 },
    { x: hb.x + 60, y: hb.y + 60 },
    { x: hb.x + 120, y: hb.y + 120 },
  ]);
  const after = await box(page);
  expect(after.width).toBeGreaterThan(before.width + 60);
  expect(after.height).toBeGreaterThan(before.height + 60);
});

test("drag to left edge snaps to half screen", async ({ page }) => {
  const before = await box(page);
  const vw = page.viewportSize()!.width;
  await drag(page, TITLEBAR, [
    { x: before.x + 60, y: before.y + 4 },
    { x: 200, y: before.y + 4 },
    { x: 4, y: before.y + 4 },
  ]);
  // snap re-renders after pointerup — poll until the window settles at the left edge
  await expect.poll(async () => (await box(page)).x).toBeLessThanOrEqual(2);
  const after = await box(page);
  expect(after.width).toBeGreaterThan(vw * 0.4);
  expect(after.width).toBeLessThan(vw * 0.6);
});

test("window stays within viewport bounds when dragged off-screen", async ({ page }) => {
  const before = await box(page);
  const vw = page.viewportSize()!.width;
  await drag(page, TITLEBAR, [
    { x: before.x + 60, y: before.y + 4 },
    { x: 1000, y: 900 },
    { x: 2000, y: 2000 },
  ]);
  const after = await box(page);
  // a drag registered (window relocated) and the title bar stays reachable on-screen
  const moved = Math.abs(after.x - before.x) + Math.abs(after.y - before.y);
  expect(moved).toBeGreaterThan(50);
  expect(after.x).toBeLessThan(vw - 100);
  expect(after.x + after.width).toBeGreaterThan(100);
});
