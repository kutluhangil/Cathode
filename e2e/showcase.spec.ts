import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ contextOptions: { reducedMotion: "reduce" } });

test("terminal 'accent blue' applies and persists the theme", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "terminal");
  const input = page.getByTestId("window-terminal").locator("input");
  await input.click();
  await input.fill("accent blue");
  await input.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
  const persisted = await page.evaluate(() => {
    const raw = localStorage.getItem("cathode.settings");
    return raw ? JSON.parse(raw).state.accent : null;
  });
  expect(persisted).toBe("blue");
});

test("settings accent swatch changes the theme", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "settings");
  await page.getByTestId("accent-swatch-white").click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "white");
});

test("hidden terminal command 'xyzzy' responds", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "terminal");
  const input = page.getByTestId("window-terminal").locator("input");
  await input.click();
  await input.fill("xyzzy");
  await input.press("Enter");
  await expect(
    page.getByTestId("window-terminal").getByText("Nothing happens."),
  ).toBeVisible();
});

test("konami code triggers the phosphor overload overlay", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  // wait for hydration so the global keydown listener is attached
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  for (const key of [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ]) {
    await page.keyboard.press(key);
  }
  await expect(page.getByTestId("konami")).toBeVisible();
});
