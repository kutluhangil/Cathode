"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useT } from "@/lib/i18n/useT";
import { parent } from "@/lib/fs/path";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

interface Props {
  mode: "open" | "save";
  /** save mode: prefilled file name */
  initialName?: string;
  onCancel: () => void;
  onPick: (result: { dir: string; name?: string; path?: string }) => void;
}

/** Küçük dosya seçici — Notepad'in aç / farklı kaydet akışları için. */
export function FsPicker({ mode, initialName, onCancel, onPick }: Props) {
  const t = useT();
  const entriesByDir = useFiles((s) => s.entriesByDir);
  const refresh = useFiles((s) => s.refresh);
  const [dir, setDir] = useState("/Documents");
  const [name, setName] = useState(initialName ?? "");

  useEffect(() => {
    void refresh(dir);
  }, [dir, refresh]);

  const entries = entriesByDir[dir] ?? [];

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50"
      onPointerDown={onCancel}
    >
      <div
        data-testid="fs-picker"
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-[80%] w-[80%] max-w-[420px] flex-col rounded-ui bg-surface-2 shadow-float"
      >
        <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5 font-mono text-[11px]">
          <button
            onClick={() => setDir(parent(dir))}
            disabled={dir === "/"}
            className="flex h-6 w-6 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 disabled:opacity-30"
          >
            <Icon name="chevron-left" size={12} />
          </button>
          <span className="truncate text-text-dim">{dir}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          {entries.map((e: FsEntry) => (
            <button
              key={e.path}
              data-testid={`fs-pick-${e.name}`}
              onClick={() => {
                if (e.kind === "dir") setDir(e.path);
                else if (mode === "open" && e.name.endsWith(".txt"))
                  onPick({ dir, path: e.path });
                else if (mode === "save") setName(e.name);
              }}
              className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left font-mono text-[12px] text-text-dim hover:bg-surface-3 hover:text-text"
            >
              <Icon name={e.kind === "dir" ? "folder" : "file"} size={14} />
              <span className="truncate">{e.name}</span>
            </button>
          ))}
        </div>
        {mode === "save" && (
          <div className="flex items-center gap-2 border-t border-border-soft p-2">
            <input
              data-testid="fs-save-name"
              autoFocus
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              placeholder={`${t("files.untitled")}.txt`}
              className="flex-1 rounded-btn bg-surface-0 px-2 py-1 font-mono text-[12px] text-text outline-none"
            />
            <button
              data-testid="fs-save-confirm"
              onClick={() => {
                const n = name.trim();
                if (n) onPick({ dir, name: n.endsWith(".txt") ? n : `${n}.txt` });
              }}
              className="rounded-btn bg-accent px-3 py-1 text-[12px] text-accent-ink"
            >
              {t("notepad.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
