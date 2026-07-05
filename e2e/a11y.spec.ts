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
