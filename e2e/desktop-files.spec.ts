import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ contextOptions: { reducedMotion: "reduce" } });

test("a file in /Desktop appears as a desktop icon", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "readme.txt", "hi");
  });
  await expect(page.getByTestId("desk-file-readme.txt")).toBeVisible();
});

test("dragging a desktop icon persists its position across reload", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "note.txt", "x");
  });
  const icon = page.getByTestId("desk-file-note.txt");
  const before = (await icon.boundingBox())!;
  await page.mouse.move(before.x + 20, before.y + 20);
  await page.mouse.down();
  await page.mouse.move(before.x + 220, before.y + 160, { steps: 12 });
  await page.mouse.up();

  // position write is debounced 300ms — wait, then reload
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  const after = (await page.getByTestId("desk-file-note.txt").boundingBox())!;
  expect(after.x).toBeGreaterThan(before.x + 120);
  expect(after.y).toBeGreaterThan(before.y + 80);
});

test("double-clicking a desktop text file opens Notepad", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Desktop", "open-me.txt", "content here");
  });
  await page.getByTestId("desk-file-open-me.txt").dblclick();
  await expect(page.getByTestId("window-notepad")).toBeVisible();
  await expect(page.getByTestId("np-textarea")).toHaveValue("content here");
});
