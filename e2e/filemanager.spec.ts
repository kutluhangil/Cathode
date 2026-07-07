import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test("opens File Manager and lists seeded folders", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "filemanager");
  await expect(page.getByTestId("fm-entry-Desktop")).toBeVisible();
  await expect(page.getByTestId("fm-entry-Documents")).toBeVisible();
  await expect(page.getByTestId("fm-entry-Pictures")).toBeVisible();
});

test("navigates into a folder and back via breadcrumb", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createDir("/Documents", "Work");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await expect(page.getByTestId("fm-entry-Work")).toBeVisible();
  await page.getByTestId("fm-breadcrumb-root").click();
  await expect(page.getByTestId("fm-entry-Documents")).toBeVisible();
});

test("creates a folder and a file via the toolbar", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();

  await page.getByTestId("fm-new-folder").click();
  await page.getByTestId("fm-rename-input").fill("Reports");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-Reports")).toBeVisible();

  await page.getByTestId("fm-new-file").click();
  await page.getByTestId("fm-rename-input").fill("todo");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-todo.txt")).toBeVisible();
});

test("renames then deletes an entry", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(async () => {
    await (window as any).__files.getState().createDir("/Documents", "Old");
  });
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();

  await page.getByTestId("fm-entry-Old").click({ button: "right" });
  await page.getByRole("menuitem", { name: /rename|adland/i }).click();
  await page.getByTestId("fm-rename-input").fill("New");
  await page.getByTestId("fm-rename-input").press("Enter");
  await expect(page.getByTestId("fm-entry-New")).toBeVisible();

  await page.getByTestId("fm-entry-New").click({ button: "right" });
  await page.getByRole("menuitem", { name: /delete|sil/i }).click();
  await expect(page.getByTestId("fm-entry-New")).toHaveCount(0);
});
