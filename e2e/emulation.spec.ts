import { test, expect } from "@playwright/test";
import { bypassBoot, openAppFromDesktop } from "./helpers";

// emulator windows boot real VMs — give room; disable entry anim for stable clicks
test.setTimeout(60_000);
test.use({ contextOptions: { reducedMotion: "reduce" } });

test("different OS emulators open in separate windows + perf warning", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "os-kolibri");
  await openAppFromDesktop(page, "os-freedos");
  await expect(page.getByTestId("window-os-kolibri")).toBeVisible();
  await expect(page.getByTestId("window-os-freedos")).toBeVisible();
  await expect(page.getByTestId("emu-perf-warning")).toBeVisible();
});

test("opening the same OS twice focuses the existing window (singleton)", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await openAppFromDesktop(page, "os-kolibri");
  await openAppFromDesktop(page, "os-kolibri");
  await expect(page.getByTestId("window-os-kolibri")).toHaveCount(1);
  await expect(page.getByTestId("emu-perf-warning")).toHaveCount(0);
});
