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
  // fullscreen: spans (near) the whole viewport — clearly wider than a normal
  // windowed spawn (~327px clamped on this width), tolerating device subpixel rounding
  expect(box.width).toBeGreaterThan(vw * 0.95);
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
