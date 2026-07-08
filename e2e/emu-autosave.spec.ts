import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

// booting a real VM is slow — give it room
test.setTimeout(90_000);

test("closing a ready emulator auto-saves its session to OPFS", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  // clean any prior saved state
  await openAppFromDesktop(page, "os-kolibri");
  await page.waitForFunction(() => !!(window as any).__persist);
  await page.evaluate(async () => {
    try {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry("retrograde-states", { recursive: true });
    } catch {
      /* none */
    }
  });
  // wait for the emulator to reach ready
  await expect(
    page.locator('[data-testid="emu-status"][data-phase="ready"]'),
  ).toBeVisible({ timeout: 60_000 });
  // close the emulator window → auto-save on unmount
  await page.getByTestId("window-close-os-kolibri").click();
  // the saved state file should now exist in OPFS
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const p = (window as any).__persist;
          return p ? p.hasState("v86-kolibri") : false;
        }),
      { timeout: 10_000 },
    )
    .toBe(true);
});
