"use client";

import { useCallback } from "react";
import { useSettings } from "@/store/settingsStore";
import { dictionaries } from "./index";
import type { Dict, TParams } from "./types";

function resolve(dict: Dict, key: string): string | undefined {
  const val = key.split(".").reduce<string | Dict | undefined>(
    (acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined),
    dict,
  );
  return typeof val === "string" ? val : undefined;
}

function interpolate(tpl: string, params?: TParams): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

/** Aktif dile göre çeviri fonksiyonu döndürür. Anahtar yoksa anahtarı döner. */
export function useT() {
  const lang = useSettings((s) => s.lang);
  return useCallback(
    (key: string, params?: TParams) => {
      const hit = resolve(dictionaries[lang], key);
      return hit === undefined ? key : interpolate(hit, params);
    },
    [lang],
  );
}
