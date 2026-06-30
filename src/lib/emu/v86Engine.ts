"use client";

import { V86 } from "v86";
import type { OsDefinition } from "@/data/os";

/** v86 binary'leri public/v86 altında (spec §2.1). */
const WASM_PATH = "/v86/v86.wasm";
const BIOS = { url: "/v86/seabios.bin" };
const VGA_BIOS = { url: "/v86/vgabios.bin" };

const MB = 1024 * 1024;

export type EmuPhase =
  | "idle"
  | "downloading"
  | "booting"
  | "ready"
  | "error";

export interface EmuCallbacks {
  onProgress?: (loaded: number, total: number) => void;
  onPhase?: (phase: EmuPhase) => void;
  onError?: (message: string) => void;
}

type V86Image =
  | { url: string }
  | { url: string; async: true; size: number }
  | { buffer: ArrayBuffer };

function diskOption(os: OsDefinition, override?: ArrayBuffer): V86Image {
  if (override) return { buffer: override };
  if (os.image.async && os.image.size) {
    return { url: os.image.url, async: true, size: os.image.size };
  }
  return { url: os.image.url };
}

/**
 * Tek bir OS örneğini yönetir. Tarayıcı sandbox'ında, izole;
 * emüle OS internete bağlı değildir (net_device verilmez).
 */
export class V86Engine {
  private vm: V86 | null = null;
  private cb: EmuCallbacks;

  constructor(cb: EmuCallbacks = {}) {
    this.cb = cb;
  }

  /** override: BYOI için kullanıcının yüklediği imaj buffer'ı. */
  start(
    container: HTMLElement,
    os: OsDefinition,
    override?: ArrayBuffer,
  ): void {
    const disk = diskOption(os, override);

    this.cb.onPhase?.(os.image.async && !override ? "downloading" : "booting");

    this.vm = new V86({
      wasm_path: WASM_PATH,
      bios: BIOS,
      vga_bios: VGA_BIOS,
      screen: { container },
      memory_size: os.memoryMB * MB,
      vga_memory_size: os.vgaMB * MB,
      boot_order: os.bootOrder,
      autostart: true,
      // emüle OS internete bağlı değil — net_device bilerek verilmedi (spec §2)
      [os.drive]: disk,
    } as ConstructorParameters<typeof V86>[0]);

    this.vm.add_listener("download-progress", (e) => {
      if (e.total > 0) this.cb.onProgress?.(e.loaded, e.total);
    });
    this.vm.add_listener("download-error", () => {
      this.cb.onPhase?.("error");
      this.cb.onError?.("imaj indirilemedi");
    });
    this.vm.add_listener("emulator-loaded", () => this.cb.onPhase?.("booting"));
    this.vm.add_listener("emulator-ready", () => this.cb.onPhase?.("ready"));
  }

  restart() {
    this.vm?.restart();
  }

  async saveState(): Promise<ArrayBuffer | null> {
    if (!this.vm) return null;
    return this.vm.save_state();
  }

  async restoreState(state: ArrayBuffer) {
    await this.vm?.restore_state(state);
  }

  async destroy() {
    try {
      await this.vm?.destroy();
    } catch {
      /* yok say */
    }
    this.vm = null;
  }
}
