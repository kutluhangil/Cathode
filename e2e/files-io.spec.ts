import { test, expect, type Page } from "@playwright/test";
import { resetFs, openAppFromDesktop, bypassBoot } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function term(page: Page, cmd: string) {
  const input = page.getByTestId("window-terminal").getByRole("textbox");
  await input.fill(cmd);
  await input.press("Enter");
}

test("terminal filesystem commands mirror the VFS", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "terminal");
  const win = page.getByTestId("window-terminal");

  await term(page, "mkdir Notes");
  await term(page, "cd Notes");
  await expect(page.getByTestId("terminal-prompt")).toHaveText("guest@retrograde:~/Notes$");
  await term(page, "touch todo.txt");
  await page.evaluate(() =>
    (window as any).__files.getState().createFile("/Notes", "hello.txt", "phosphor glow"),
  );
  await term(page, "ls");
  await expect(win).toContainText("todo.txt");
  await term(page, "cat hello.txt");
  await expect(win).toContainText("phosphor glow");
  await term(page, "cat missing.txt");
  await expect(win).toContainText("missing.txt");

  await term(page, "cd ..");
  await term(page, "rm Notes");
  await expect(win).toContainText(/silindi: \/Notes|removed: \/Notes/);
  await expect(page.getByTestId("terminal-prompt")).toHaveText("guest@retrograde:~$");
  const exists = await page.evaluate(async () => {
    const st = (window as any).__files.getState();
    await st.refresh("/");
    return st.entriesByDir["/"].some((e: { name: string }) => e.name === "Notes");
  });
  expect(exists).toBe(false);
  await term(page, "rm /");
  await expect(win.getByText(/kök klasör silinemez|cannot remove the root/)).toBeVisible();
});

test("files: upload, rename-safe duplicate, download", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();

  const file = { name: "report.txt", mimeType: "text/plain", buffer: Buffer.from("retro report") };
  await page.getByTestId("fm-upload-input").setInputFiles(file);
  await expect(page.getByTestId("fm-entry-report.txt")).toBeVisible();
  await page.getByTestId("fm-upload-input").setInputFiles(file);
  await expect(page.getByTestId("fm-entry-report (2).txt")).toBeVisible();

  await page.getByTestId("fm-entry-report.txt").click({ button: "right" });
  const dl = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: /İndir|Download/ }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe("report.txt");
});

test("files dropped on the desktop land in /Desktop", async ({ page }) => {
  await resetFs(page);
  await page.evaluate(() => {
    const dt = new DataTransfer();
    dt.items.add(new File(["dropped"], "dropped.txt", { type: "text/plain" }));
    const target = document.elementFromPoint(window.innerWidth - 200, window.innerHeight / 2)!;
    for (const type of ["dragover", "drop"])
      target.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true }));
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        ((window as any).__files.getState().entriesByDir["/Desktop"] ?? []).map(
          (e: { name: string }) => e.name,
        ),
      ),
    )
    .toContain("dropped.txt");
});

test("?open= deep link launches apps", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/?open=terminal,calculator");
  await expect(page.getByTestId("window-terminal")).toBeVisible();
  await expect(page.getByTestId("window-calculator")).toBeVisible();
});

test("games catalog ships a playable shareware title", async ({ page }) => {
  await bypassBoot(page);
  await page.goto("/");
  await expect(page.getByTestId("desktop-icon-game-doom-shareware")).toBeVisible();
  const zip = await page.request.get("/games/doom-sw-1.9.zip");
  expect(zip.ok()).toBe(true);
});
