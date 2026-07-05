import type { Page } from "@playwright/test";

/** Seed the boot flag before load so the desktop renders immediately. */
export async function bypassBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("cathode.booted", "1");
    } catch {
      /* storage unavailable — ignore */
    }
  });
}

/** Open an app by clicking its desktop icon (single click opens). */
export async function openAppFromDesktop(page: Page, appId: string) {
  await page.getByTestId(`desktop-icon-${appId}`).click();
}
