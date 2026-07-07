import type { FsEntry } from "./types";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

export function isImage(name: string): boolean {
  return IMAGE_EXT.test(name);
}

export function isText(name: string): boolean {
  return /\.txt$/i.test(name);
}

type OpenFn = (
  appId: string,
  title: string,
  size: { w: number; h: number },
  props?: Record<string, unknown>,
) => string;

/** Bir dosyayı açarken doğru uygulamaya yönlendir (çift tık). */
export function openFile(open: OpenFn, entry: FsEntry): void {
  if (entry.kind !== "file") return;
  if (isImage(entry.name))
    open("imageviewer", "apps.viewer", { w: 640, h: 480 }, { path: entry.path });
  else if (isText(entry.name))
    open("notepad", "apps.notepad", { w: 460, h: 420 }, { path: entry.path });
}
