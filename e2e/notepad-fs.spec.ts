import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test("save-as writes a file that appears in File Manager and persists", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "notepad");
  await page.getByTestId("np-textarea").fill("retrograde notes");
  await page.getByTestId("np-save-as").click();
  await page.getByTestId("fs-save-name").fill("memo");
  await page.getByTestId("fs-save-confirm").click();
  await expect(page.getByTestId("np-title")).toContainText("memo.txt");

  await page.reload();
  await page.waitForFunction(() => (window as any).__files?.getState().hydrated);
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await expect(page.getByTestId("fm-entry-memo.txt")).toBeVisible();
});

test("double-clicking a text file opens Notepad with its content", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createFile("/Documents", "hi.txt", "hello world");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await page.getByTestId("fm-entry-hi.txt").dblclick();
  await expect(page.getByTestId("window-notepad")).toBeVisible();
  await expect(page.getByTestId("np-textarea")).toHaveValue("hello world");
});
