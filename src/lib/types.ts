import type { ComponentType } from "react";

/** Kabuk genelinde paylaşılan tipler. */

export type AccentName = "amber" | "green";

export type WallpaperId =
  | "phosphor"
  | "blueprint"
  | "testcard"
  | "void"
  | "photo";

export type WindowStatus = "normal" | "minimized" | "maximized";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  rect: Rect;
  /** maximize öncesi konum — restore için saklanır */
  prevRect: Rect | null;
  z: number;
  status: WindowStatus;
}

export interface AppDefinition {
  id: string;
  name: string;
  /** Tek karakter / kısa glyph tabanlı özgün ikon (Windows logosu YOK) */
  glyph: string;
  description?: string;
  component: ComponentType<{ windowId: string }>;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  /** dock'a sabitlensin mi */
  pinned?: boolean;
}
