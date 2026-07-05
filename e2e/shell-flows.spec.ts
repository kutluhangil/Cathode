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
  // wait for hydration (global keydown listener attached) before firing the shortcut
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  // app accepts ctrlKey || metaKey; Control is reliable across platforms in headless
  await page.keyboard.press("Control+KeyK");
  const input = page.getByTestId("command-palette-input");
  await expect(input).toBeVisible();
  // no query: Enter launches the first highlighted entry (the About app)
  await input.press("Enter");
  await expect(page.getByTestId("window-about")).toBeVisible();
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
