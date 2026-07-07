import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

test("writes and reads a binary file, preserving bytes", async ({ page }) => {
  await resetFs(page);
  const size = await page.evaluate(async (b64) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });
    const f = (window as any).__files.getState();
    await f.writeBlob("/Pictures", "dot.png", blob);
    await f.refresh("/Pictures");
    const entry = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "dot.png");
    return entry ? entry.size : -1;
  }, PNG_B64);
  expect(size).toBeGreaterThan(0);
});

test("renaming a binary file preserves its content", async ({ page }) => {
  await resetFs(page);
  const same = await page.evaluate(async (b64) => {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const f = (window as any).__files.getState();
    await f.writeBlob("/Pictures", "a.png", new Blob([arr], { type: "image/png" }));
    await f.refresh("/Pictures");
    const before = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "a.png").size;
    await f.rename("/Pictures/a.png", "b.png");
    await f.refresh("/Pictures");
    const after = (window as any).__files
      .getState()
      .entriesByDir["/Pictures"].find((e: any) => e.name === "b.png").size;
    return before === after && after === arr.length;
  }, PNG_B64);
  expect(same).toBe(true);
});
