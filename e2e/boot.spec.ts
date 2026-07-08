import { test, expect } from "@playwright/test";

test.describe("boot", () => {
  test("shows boot sequence then transitions to desktop on click", async ({ page }) => {
    await page.goto("/");
    // BIOS banner is hardcoded English — stable anchor
    await expect(page.getByText("Retrograde Systems 5100")).toBeVisible();
    // clicking the boot overlay skips to desktop
    await page.getByRole("button", { name: /skip|atla/i }).click();
    await expect(page.getByText("Retrograde Systems 5100")).toHaveCount(0);
  });

  test("boot shown once per session", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /skip|atla/i }).click();
    await page.reload();
    // second load in same session: no boot banner
    await expect(page.getByText("Retrograde Systems 5100")).toHaveCount(0);
  });
});
