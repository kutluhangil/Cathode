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
  // wait for hydration so Tab lands on a real focusable, not document.body
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  expect(outline).not.toBe("none");
});
