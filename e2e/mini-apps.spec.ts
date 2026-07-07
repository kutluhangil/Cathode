import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// window entry animation shifts buttons mid-gesture → disable it so clicks land
test.use({ contextOptions: { reducedMotion: "reduce" } });

const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function seedPng(page: import("@playwright/test").Page, name: string) {
  await page.evaluate(
    async ({ b64, name }) => {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      await (window as any).__files
        .getState()
        .writeBlob("/Pictures", name, new Blob([arr], { type: "image/png" }));
    },
    { b64: PNG_B64, name },
  );
}

test("calculator computes with mouse", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "calculator");
  await page.getByTestId("calc-key-7").click();
  await page.getByTestId("calc-key-×").click();
  await page.getByTestId("calc-key-6").click();
  await page.getByTestId("calc-key-=").click();
  await expect(page.getByTestId("calc-display")).toHaveText("42");
});

test("calculator computes with keyboard", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "calculator");
  await page.keyboard.press("2");
  await page.keyboard.press("+");
  await page.keyboard.press("3");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("calc-display")).toHaveText("5");
});

test("double-clicking an image opens the Image Viewer", async ({ page }) => {
  await resetFs(page);
  await seedPng(page, "pic.png");
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Pictures").dblclick();
  await page.getByTestId("fm-entry-pic.png").dblclick();
  await expect(page.getByTestId("window-imageviewer")).toBeVisible();
  const nat = await page
    .getByTestId("viewer-img")
    .evaluate((el) => (el as HTMLImageElement).naturalWidth);
  expect(nat).toBeGreaterThan(0);
});

test("paint draws a stroke and saves a PNG into /Pictures", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "paint");
  const canvas = page.getByTestId("paint-canvas");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 40, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 120, { steps: 10 });
  await page.mouse.up();
  await page.getByTestId("paint-save").click();
  await expect(page.getByTestId("paint-saved")).toBeVisible();
  const has = await page.evaluate(async () => {
    const f = (window as any).__files.getState();
    await f.refresh("/Pictures");
    return (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].some((e: any) => /^paint-.*\.png$/.test(e.name));
  });
  expect(has).toBe(true);
});
