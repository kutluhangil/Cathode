import { test, expect, type Page } from "@playwright/test";
import { zip, unzip } from "../src/lib/backup/zip";
import { resetFs, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ contextOptions: { reducedMotion: "reduce" } });

test.describe("zip (unit)", () => {
  test("round-trips entries and detects corruption", async () => {
    const enc = new TextEncoder();
    const entries = [
      { name: "a.txt", data: enc.encode("hello") },
      { name: "dir/ünicode.bin", data: new Uint8Array([0, 1, 2, 255]) },
      { name: "empty", data: new Uint8Array() },
    ];
    const buf = await zip(entries).arrayBuffer();
    const back = unzip(buf);
    expect(back.map((e) => e.name)).toEqual(entries.map((e) => e.name));
    expect(Array.from(back[1].data)).toEqual([0, 1, 2, 255]);

    const broken = new Uint8Array(buf.slice(0));
    broken[30 + "a.txt".length] ^= 0xff; // ilk dosyanın ilk byte'ı
    expect(() => unzip(broken.buffer)).toThrow(/corrupt/);
    expect(() => unzip(new ArrayBuffer(10))).toThrow();
  });
});

async function openSystemSettings(page: Page) {
  await openAppFromDesktop(page, "settings");
  await page.getByTestId("window-settings").getByRole("button", { name: /^(sistem|system)$/i }).click();
}

const desktopNames = (page: Page) =>
  page.evaluate(async () => {
    const st = (window as any).__files.getState();
    await st.refresh("/Desktop");
    return (st.entriesByDir["/Desktop"] ?? []).map((e: { name: string }) => e.name);
  });

test("backup → wipe → restore brings files and settings back", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(() =>
    (window as any).__files.getState().createFile("/Desktop", "keep.txt", "precious"),
  );
  await page.evaluate(() => localStorage.setItem("retrograde.probe", "kept"));
  await openSystemSettings(page);

  const dl = page.waitForEvent("download");
  await page.getByTestId("backup-download").click();
  const backupPath = await (await dl).path();
  expect(backupPath).toBeTruthy();

  // veriyi boz: dosyayı ve ayarı sil
  await page.evaluate(() => (window as any).__files.getState().remove("/Desktop/keep.txt"));
  await page.evaluate(() => localStorage.removeItem("retrograde.probe"));
  expect(await desktopNames(page)).not.toContain("keep.txt");

  page.once("dialog", (d) => void d.accept());
  const reloaded = page.waitForEvent("load");
  await page.getByTestId("backup-restore-input").setInputFiles(backupPath!);
  await reloaded;
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  expect(await desktopNames(page)).toContain("keep.txt");
  const text = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const fs = await root.getDirectoryHandle("retrograde-fs");
    const desk = await fs.getDirectoryHandle("Desktop");
    return (await (await desk.getFileHandle("keep.txt")).getFile()).text();
  });
  expect(text).toBe("precious");
  expect(await page.evaluate(() => localStorage.getItem("retrograde.probe"))).toBe("kept");
});

test("an invalid archive is rejected without touching data", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(() =>
    (window as any).__files.getState().createFile("/Desktop", "safe.txt", "x"),
  );
  await openSystemSettings(page);
  const evil = await zip([
    { name: "manifest.json", data: new TextEncoder().encode('{"app":"retrograde","format":1}') },
    { name: "opfs/retrograde-fs/../escape.txt", data: new Uint8Array([1]) },
  ]).arrayBuffer();
  page.once("dialog", (d) => void d.accept());
  await page.getByTestId("backup-restore-input").setInputFiles({
    name: "evil.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(evil),
  });
  await expect(page.getByRole("alert").filter({ hasText: /Retrograde/ })).toBeVisible();
  expect(await desktopNames(page)).toContain("safe.txt");
});
