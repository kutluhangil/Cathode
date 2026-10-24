import { test, expect } from "@playwright/test";
import { isPrivateAddress, assertPublicUrl } from "../src/app/api/proxy/guard";
import { resetFs, openAppFromDesktop } from "./helpers";

test.use({ contextOptions: { reducedMotion: "reduce" } });

test.describe("proxy guard (unit)", () => {
  test("flags private, loopback, link-local and mapped addresses", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "::1",
      "::",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "[::1]",
    ])
      expect(isPrivateAddress(ip), ip).toBe(true);
  });

  test("allows public addresses", () => {
    for (const ip of ["93.184.215.14", "1.1.1.1", "172.32.0.1", "192.0.78.9", "2606:4700::1111"])
      expect(isPrivateAddress(ip), ip).toBe(false);
  });

  test("rejects bad schemes, ports, credentials and private hosts", async () => {
    for (const url of [
      "file:///etc/passwd",
      "ftp://example.com/",
      "http://example.com:8080/",
      "http://user:pw@example.com/",
      "http://localhost/",
      "http://127.0.0.1/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data/",
      "not a url",
    ])
      await expect(assertPublicUrl(url), url).rejects.toThrow();
  });
});

test.describe("proxy route", () => {
  test("refuses internal targets and stays sandboxed", async ({ request }) => {
    const local = await request.get("/api/proxy?url=" + encodeURIComponent("http://127.0.0.1:3000/"));
    expect(local.status()).toBe(400); // port 3000 → reddedildi
    const loop = await request.get("/api/proxy?url=" + encodeURIComponent("http://127.0.0.1/"));
    expect(loop.status()).toBe(403);
    expect(loop.headers()["content-security-policy"]).toContain("sandbox");
    const missing = await request.get("/api/proxy");
    expect(missing.status()).toBe(400);
  });
});

test.describe("browser app", () => {
  test("iframe is sandboxed without same-origin access", async ({ page }) => {
    await resetFs(page);
    await openAppFromDesktop(page, "browser");
    await page.getByPlaceholder("Enter URL or search term...").fill("https://example.com/");
    await page.keyboard.press("Enter");
    const iframe = page.locator('iframe[title="Browser Viewport"]');
    await expect(iframe).toHaveAttribute("sandbox", "allow-scripts allow-forms");
  });

  // ağ gerektirir (example.com) — çevrimdışı ortamda OFFLINE=1 ile atla
  test("proxied page cannot touch the app's storage", async ({ page }) => {
    test.skip(!!process.env.OFFLINE, "needs network");
    await resetFs(page);
    await page.evaluate(() => localStorage.setItem("secret-probe", "1"));
    await openAppFromDesktop(page, "browser");
    await page.getByPlaceholder("Enter URL or search term...").fill("https://example.com/");
    await page.keyboard.press("Enter");
    const frame = page.frameLocator('iframe[title="Browser Viewport"]');
    await expect(frame.locator("body")).toContainText("documentation", { timeout: 20_000 });
    const handle = page.frames().find((f) => f.url().includes("/api/proxy"));
    expect(handle).toBeTruthy();
    const probe = await handle!.evaluate(() => {
      try {
        return localStorage.getItem("secret-probe") ?? "empty";
      } catch {
        return "blocked";
      }
    });
    expect(probe).toBe("blocked");
  });
});
