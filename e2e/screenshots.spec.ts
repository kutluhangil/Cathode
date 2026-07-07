import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/**
 * Not bir regresyon testi değil — README için docs/screenshots/ altına görsel üretir.
 * `npm run test:e2e -- screenshots.spec.ts --project=desktop` ile çalıştırılır.
 */
test.use({ viewport: { width: 1280, height: 800 } });

// generator, not a regression test — only runs when CAPTURE=1 (keeps the default suite
// fast and avoids re-writing the PNGs on every run)
test.skip(!process.env.CAPTURE, "set CAPTURE=1 to regenerate screenshots");

const DIR = "docs/screenshots";

test("capture: clean desktop", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  await page.waitForTimeout(400); // let icons settle
  await page.screenshot({ path: `${DIR}/desktop.png` });
});

test("capture: apps open", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  await openAppFromDesktop(page, "calculator");
  await openAppFromDesktop(page, "filemanager");
  await openAppFromDesktop(page, "notepad");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${DIR}/apps.png` });
});

test("capture: paint", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await expect(page.getByTestId("desktop-icon-about")).toBeVisible();
  await openAppFromDesktop(page, "paint");
  const canvas = page.getByTestId("paint-canvas");
  const box = (await canvas.boundingBox())!;
  // draw a little something
  await page.mouse.move(box.x + 60, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 60, { steps: 8 });
  await page.mouse.move(box.x + 260, box.y + 220, { steps: 8 });
  await page.mouse.move(box.x + 380, box.y + 80, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${DIR}/paint.png` });
});
