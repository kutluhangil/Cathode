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
  // about cascades over notepad; click notepad's exposed top-left title bar to focus it
  await notepad.click({ position: { x: 6, y: 4 } });
  const zNotepad = await notepad.evaluate((el) => Number(getComputedStyle(el).zIndex));
  const zAbout = await about.evaluate((el) => Number(getComputedStyle(el).zIndex));
  expect(zNotepad).toBeGreaterThan(zAbout);
});
