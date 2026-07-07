export type FsKind = "file" | "dir";

export interface FsEntry {
  name: string; // "notes.txt"
  path: string; // "/Desktop/notes.txt"
  kind: FsKind;
  size: number; // bytes (0 for dirs)
  modified: number; // epoch ms (0 for dirs)
}
