import { test, expect } from "@playwright/test";
import { resetFs } from "./helpers";

type StoreEntry = { name: string; path: string; kind: "file" | "dir" };

/* eslint-disable @typescript-eslint/no-explicit-any */

test("seeds the top-level folders", async ({ page }) => {
  await resetFs(page);
  const names = await page.evaluate(() => {
    const f = (window as any).__files.getState();
    return (f.entriesByDir["/"] as StoreEntry[]).map((e) => e.name);
  });
  expect(names).toEqual(["Desktop", "Documents", "Pictures"]);
});

test("writes a file that persists across reload", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Documents", "a.txt", "hello");
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  const path = await page.evaluate(async () => {
    const f = (window as any).__files.getState();
    await f.refresh("/Documents");
    const entry = (window as any).__files
      .getState()
      .entriesByDir["/Documents"].find((e: StoreEntry) => e.name === "a.txt");
    return entry ? entry.path : null;
  });
  expect(path).toBe("/Documents/a.txt");
});

test("creates, renames, and removes a folder", async ({ page }) => {
  await resetFs(page);
  const result = await page.evaluate(async () => {
    const f = (window as any).__files.getState();
    await f.createDir("/Documents", "Work");
    const renamed = await f.rename("/Documents/Work", "Projects");
    await f.refresh("/Documents");
    const afterRename = (window as any).__files
      .getState()
      .entriesByDir["/Documents"].map((e: StoreEntry) => e.name);
    await f.remove(renamed);
    await f.refresh("/Documents");
    const afterRemove = (window as any).__files
      .getState()
      .entriesByDir["/Documents"].map((e: StoreEntry) => e.name);
    return { afterRename, afterRemove };
  });
  expect(result.afterRename).toContain("Projects");
  expect(result.afterRemove).not.toContain("Projects");
});
