import type { Lang } from "./types";
import { tr } from "./tr";
import { en } from "./en";

export const dictionaries = { tr, en } as const;

export const LANGS: { id: Lang; label: string }[] = [
  { id: "tr", label: "TR" },
  { id: "en", label: "EN" },
];

export type { Lang } from "./types";
