import { test, expect } from "@playwright/test";
import { resetFs, openAppFromDesktop } from "./helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */

test.use({ contextOptions: { reducedMotion: "reduce" } });

/** 1 sn, 8 kHz, 16-bit mono 440 Hz sinüs WAV. */
function sineWav(seconds = 1, rate = 8000): Buffer {
  const n = seconds * rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 12000), 44 + i * 2);
  return buf;
}

test("media player imports audio into /Music and plays it", async ({ page }) => {
  await resetFs(page);
  await openAppFromDesktop(page, "mediaplayer");
  await page.getByTestId("player-upload").setInputFiles({ name: "tone.wav", mimeType: "audio/wav", buffer: sineWav() });
  await page.getByTestId("player-track-tone.wav").dblclick();
  await expect(page.getByTestId("player-title")).toHaveText("tone.wav");
  await expect
    .poll(() => page.getByTestId("player-audio").evaluate((a: HTMLAudioElement) => a.currentTime), { timeout: 10_000 })
    .toBeGreaterThan(0);
  await page.getByTestId("player-toggle").click();
  await expect
    .poll(() => page.getByTestId("player-audio").evaluate((a: HTMLAudioElement) => a.paused))
    .toBe(true);
});

test("double-clicking an audio file in Files opens the player", async ({ page }) => {
  await resetFs(page);
  const wav = sineWav().toString("base64");
  await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    await (window as any).__files.getState().writeBlob("/Documents", "beep.wav", new Blob([bin], { type: "audio/wav" }));
  }, wav);
  await openAppFromDesktop(page, "filemanager");
  await page.getByTestId("fm-entry-Documents").dblclick();
  await page.getByTestId("fm-entry-beep.wav").dblclick();
  await expect(page.getByTestId("window-mediaplayer")).toBeVisible();
  await expect(page.getByTestId("player-title")).toHaveText("beep.wav");
});
