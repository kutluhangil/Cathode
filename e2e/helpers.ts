import type { Page } from "@playwright/test";

/** Seed the boot flag before load so the desktop renders immediately. */
export async function bypassBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("retrograde.booted", "1");
    } catch {
      /* storage unavailable — ignore */
    }
  });
}

/** Open an app by clicking its desktop icon (single click opens). */
export async function openAppFromDesktop(page: Page, appId: string) {
  await page.getByTestId(`desktop-icon-${appId}`).click();
}

/**
 * Wipe the VFS after first load so each test starts clean. Done via evaluate
 * (not addInitScript) so the test's own page.reload() does NOT re-wipe — that
 * is what persistence assertions rely on.
 */
export async function resetFs(page: Page) {
  await bypassBoot(page);
  await page.goto("/");
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("retrograde-fs", { recursive: true });
    } catch {
      /* nothing to remove */
    }
  });
  await page.reload();
  // wait for the store to finish hydrating (re-seeds folders)
  await page.waitForFunction(() => {
    const f = (
      window as unknown as { __files?: { getState: () => { hydrated: boolean } } }
    ).__files;
    return !!f && f.getState().hydrated;
  });
}
