import { test, expect, type Page } from "@playwright/test";
import { buildFloppy, readFloppy, toShortName, FLOPPY_CAPACITY } from "../src/lib/emu/fat12";
import { resetFs } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.describe("fat12 (unit)", () => {
  const enc = new TextEncoder();

  test("round-trips files and maps long names to 8.3", () => {
    const big = new Uint8Array(5000).map((_, i) => i % 251);
    const { image, names } = buildFloppy([
      { name: "README.TXT", data: enc.encode("hi") },
      { name: "uzun dosya adı.txt", data: big },
      { name: "uzun dosya başka.txt", data: enc.encode("x") },
      { name: "empty.dat", data: new Uint8Array() },
    ]);
    expect(image.length).toBe(1474560);
    const back = readFloppy(image);
    expect(back.map((f) => f.name)).toEqual(["README.TXT", "UZUNDO~1.TXT", "UZUNDO~2.TXT", "EMPTY.DAT"]);
    expect(Array.from(back[1].data)).toEqual(Array.from(big));
    expect(names.get("UZUNDO~1.TXT")).toBe("uzun dosya adı.txt");
  });

  test("short names stay unique and capacity is enforced", () => {
    const taken = new Set(["GAME.EXE"]);
    expect(toShortName("game.exe", new Set())).toBe("GAME.EXE"); // FAT büyük/küçük harf ayırmaz
    expect(toShortName("my game.exe", new Set())).toBe("MYGAME~1.EXE"); // boşluk düştü → kayıplı
    expect(toShortName("GAME.EXE", taken)).toBe("GAME~1.EXE");
    expect(toShortName("GAME.EXE", new Set())).toBe("GAME.EXE");
    expect(() => buildFloppy([{ name: "huge.bin", data: new Uint8Array(FLOPPY_CAPACITY + 1) }])).toThrow(
      "floppy.full",
    );
  });
});

/** v86 shift durumunu gerçek tuş olaylarından okur — ":" için Shift basılı gönderilmeli. */
async function typeDos(page: Page, text: string) {
  for (const ch of text) {
    if (ch === ":") await page.keyboard.press("Shift+Semicolon");
    else if (ch === "\n") await page.keyboard.press("Enter");
    else await page.keyboard.type(ch);
    await page.waitForTimeout(25);
  }
}

const screenText = (page: Page) =>
  page.getByTestId("window-os-freedos").locator("div[style*='pre']").first();

test("FreeDOS reads and writes the VFS through the B: floppy", async ({ page }) => {
  test.setTimeout(150_000);
  await resetFs(page);
  await page.evaluate(() =>
    (window as any).__files.getState().createFile("/Floppy", "hello.txt", "HELLO FROM VFS"),
  );
  await page.goto("/?open=freedos");
  await expect(page.getByTestId("emu-status")).toHaveAttribute("data-phase", "ready", { timeout: 60_000 });
  await expect(screenText(page)).toContainText("A:\\>", { timeout: 60_000 });

  await page.getByTestId("emu-floppy").click();
  await expect(page.getByTestId("emu-floppy-note")).toContainText("1");

  await page.getByTestId("window-os-freedos").locator("canvas, div[style*='pre']").first().click();
  await typeDos(page, "type b:hello.txt\n");
  await expect(screenText(page)).toContainText("HELLO FROM VFS", { timeout: 20_000 });
  await typeDos(page, "copy b:hello.txt b:dosmade.txt\n");
  // FreeCom 0.82: "b:hello.txt => b:dosmade.txt" ardından istem geri gelir
  await expect(screenText(page)).toHaveText(/=> b:dosmade\.txt\s+A:\\>\s*$/, { timeout: 20_000 });

  await page.keyboard.press("Escape");
  await page.getByTestId("emu-floppy").click(); // kaydet + çıkar
  await expect(page.getByTestId("emu-floppy-note")).toContainText("2");

  const files = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const dir = await (await root.getDirectoryHandle("retrograde-fs")).getDirectoryHandle("Floppy");
    const out: Record<string, string> = {};
    for await (const [name, h] of (dir as any).entries())
      out[name] = await (await (h as FileSystemFileHandle).getFile()).text();
    return out;
  });
  expect(files["hello.txt"]).toBe("HELLO FROM VFS"); // orijinal uzun adına döndü
  expect(files["DOSMADE.TXT"]).toBe("HELLO FROM VFS");
});
