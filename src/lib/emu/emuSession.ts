"use client";

import { writeState, readState, hasState, deleteState } from "@/lib/persist";

/** v86 durum kaydı için minimal engine arayüzü (test edilebilirlik için enjekte edilir). */
export interface SessionEngine {
  saveState(): Promise<ArrayBuffer | null>;
  restoreState(state: ArrayBuffer): Promise<void>;
}

/** Engine'in mevcut durumunu key altında kaydet. Başarılıysa true. */
export async function saveSession(
  engine: SessionEngine,
  key: string,
): Promise<boolean> {
  const state = await engine.saveState();
  if (!state) return false;
  return writeState(key, state);
}

/** Kayıtlı durumu engine'e geri yükle. Durum varsa ve uygulandıysa true. */
export async function resumeSession(
  engine: SessionEngine,
  key: string,
): Promise<boolean> {
  const state = await readState(key);
  if (!state) return false;
  await engine.restoreState(state);
  return true;
}

export async function hasSession(key: string): Promise<boolean> {
  return hasState(key);
}

export async function dropSession(key: string): Promise<void> {
  await deleteState(key);
}

// Test/debug köprüsü — Playwright e2e fake engine ile mantığı sürebilir (client-only).
if (typeof window !== "undefined") {
  (
    window as unknown as {
      __emuSession?: {
        saveSession: typeof saveSession;
        resumeSession: typeof resumeSession;
        hasSession: typeof hasSession;
        dropSession: typeof dropSession;
      };
    }
  ).__emuSession = { saveSession, resumeSession, hasSession, dropSession };
}
