"use client";

import { useSettings } from "@/store/settingsStore";

/**
 * UI sesleri — dosyasız, WebAudio synth ile kısa fosfor bip'leri.
 * settings.sound kapalıysa hiç çalmaz (varsayılan kapalı, spec §1.7).
 * AudioContext ilk kullanıcı etkileşiminde kurulur (autoplay politikası).
 */

export type SoundName = "open" | "close" | "toggle" | "error";

interface SoundDef {
  freq: number;
  /** varsa freq'ten buraya kayar (sweep) */
  freqTo?: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const DEFS: Record<SoundName, SoundDef> = {
  open: { freq: 520, freqTo: 780, duration: 0.09, type: "square", gain: 0.035 },
  close: { freq: 660, freqTo: 320, duration: 0.09, type: "square", gain: 0.035 },
  toggle: { freq: 880, duration: 0.045, type: "square", gain: 0.028 },
  error: { freq: 150, duration: 0.18, type: "sawtooth", gain: 0.045 },
};

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined" || typeof AudioContext === "undefined")
    return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playSound(name: SoundName): void {
  if (typeof window === "undefined") return;
  if (!useSettings.getState().sound) return;
  try {
    const c = ensureCtx();
    if (!c) return;
    const d = DEFS[name];
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = d.type;
    osc.frequency.setValueAtTime(d.freq, c.currentTime);
    if (d.freqTo) {
      osc.frequency.exponentialRampToValueAtTime(
        d.freqTo,
        c.currentTime + d.duration,
      );
    }
    g.gain.setValueAtTime(d.gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d.duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + d.duration + 0.02);
  } catch {
    /* ses çalınamazsa sessizce geç */
  }
}
