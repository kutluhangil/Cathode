import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Open the emulator so its chunk (persist + emuSession bridges) loads, then wipe state. */
async function loadEmuChunk(page: import("@playwright/test").Page) {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "os-kolibri");
  await page.waitForFunction(
    () => !!(window as any).__emuSession && !!(window as any).__persist,
  );
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("cathode-states", { recursive: true });
    } catch {
      /* nothing to remove */
    }
  });
}

test("persist round-trip: write, read, has, delete", async ({ page }) => {
  await loadEmuChunk(page);
  const result = await page.evaluate(async () => {
    const p = (window as any).__persist;
    const buf = new Uint8Array([9, 8, 7, 6]).buffer;
    await p.writeState("t1", buf);
    const has = await p.hasState("t1");
    const read = await p.readState("t1");
    const bytes = read ? Array.from(new Uint8Array(read)) : null;
    await p.deleteState("t1");
    const hasAfter = await p.hasState("t1");
    return { has, bytes, hasAfter };
  });
  expect(result.has).toBe(true);
  expect(result.bytes).toEqual([9, 8, 7, 6]);
  expect(result.hasAfter).toBe(false);
});

test("emuSession save + resume round-trips through a fake engine", async ({ page }) => {
  await loadEmuChunk(page);
  const result = await page.evaluate(async () => {
    const s = (window as any).__emuSession;
    const bytes = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const saver = { async saveState() { return bytes; }, async restoreState() {} };
    const saved = await s.saveSession(saver, "sess");
    const has = await s.hasSession("sess");
    let restoredLen = -1;
    const loader = {
      async saveState() { return null; },
      async restoreState(b: ArrayBuffer) { restoredLen = b.byteLength; },
    };
    const resumed = await s.resumeSession(loader, "sess");
    await s.dropSession("sess");
    const hasAfter = await s.hasSession("sess");
    return { saved, has, resumed, restoredLen, hasAfter };
  });
  expect(result.saved).toBe(true);
  expect(result.has).toBe(true);
  expect(result.resumed).toBe(true);
  expect(result.restoredLen).toBe(5);
  expect(result.hasAfter).toBe(false);
});

test("resumeSession returns false when nothing is saved", async ({ page }) => {
  await loadEmuChunk(page);
  const resumed = await page.evaluate(async () => {
    const s = (window as any).__emuSession;
    const loader = { async saveState() { return null; }, async restoreState() {} };
    return s.resumeSession(loader, "missing-key");
  });
  expect(resumed).toBe(false);
});
