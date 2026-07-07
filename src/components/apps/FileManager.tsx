"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { segments, join, parent } from "@/lib/fs/path";
import { openFile } from "@/lib/fs/kind";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { ContextMenu, type MenuItem } from "@/components/desktop/ContextMenu";
import type { FsEntry } from "@/lib/fs/types";

interface Props {
  windowId: string;
  path?: string; // initial directory (from open() props)
}

type Prompt =
  | { mode: "folder" }
  | { mode: "file" }
  | { mode: "rename"; path: string };

function topFolders(entries: FsEntry[] | undefined): FsEntry[] {
  return (entries ?? []).filter((e) => e.kind === "dir");
}

export function FileManager({ path }: Props) {
  const t = useT();
  const supported = useFiles((s) => s.supported);
  const entriesByDir = useFiles((s) => s.entriesByDir);
  const refresh = useFiles((s) => s.refresh);
  const createDir = useFiles((s) => s.createDir);
  const createFile = useFiles((s) => s.createFile);
  const rename = useFiles((s) => s.rename);
  const remove = useFiles((s) => s.remove);
  const move = useFiles((s) => s.move);
  const open = useWindows((s) => s.open);

  const [dir, setDir] = useState(path ?? "/");
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; entry: FsEntry } | null>(
    null,
  );

  useEffect(() => {
    void refresh(dir);
    void refresh("/"); // keep move targets available
  }, [dir, refresh]);

  const entries = entriesByDir[dir] ?? [];
  const segs = segments(dir);

  const onOpenEntry = (e: FsEntry) => {
    if (e.kind === "dir") setDir(e.path);
    else openFile(open, e);
  };

  const submitPrompt = async () => {
    const name = draft.trim();
    const p = prompt;
    setPrompt(null);
    setDraft("");
    if (!name || !p) return;
    if (p.mode === "folder") await createDir(dir, name);
    else if (p.mode === "file")
      await createFile(dir, name.endsWith(".txt") ? name : `${name}.txt`);
    else await rename(p.path, name);
  };

  if (!supported) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-text-dim">
        {t("files.unsupported")}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-0">
      {/* toolbar / breadcrumb */}
      <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5">
        <button
          data-testid="fm-up"
          aria-label={t("files.up")}
          onClick={() => setDir(parent(dir))}
          disabled={dir === "/"}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text disabled:opacity-30"
        >
          <Icon name="chevron-left" size={14} />
        </button>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto font-mono text-[11px]">
          <button
            data-testid="fm-breadcrumb-root"
            onClick={() => setDir("/")}
            className="rounded px-1 text-text-dim hover:text-accent"
          >
            /
          </button>
          {segs.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-faint">›</span>
              <button
                data-testid={`fm-breadcrumb-${seg}`}
                onClick={() => setDir(join("/", ...segs.slice(0, i + 1)))}
                className="rounded px-1 text-text-dim hover:text-accent"
              >
                {seg}
              </button>
            </span>
          ))}
        </div>
        <button
          data-testid="fm-new-folder"
          aria-label={t("files.newFolder")}
          title={t("files.newFolder")}
          onClick={() => {
            setPrompt({ mode: "folder" });
            setDraft("");
          }}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="folder-plus" size={14} />
        </button>
        <button
          data-testid="fm-new-file"
          aria-label={t("files.newFile")}
          title={t("files.newFile")}
          onClick={() => {
            setPrompt({ mode: "file" });
            setDraft("");
          }}
          className="flex h-7 w-7 items-center justify-center rounded-btn text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="file" size={14} />
        </button>
      </div>

      {/* create / rename prompt */}
      {prompt && (
        <div className="flex items-center gap-2 border-b border-border-soft px-3 py-2">
          <input
            data-testid="fm-rename-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitPrompt();
              if (e.key === "Escape") {
                setPrompt(null);
                setDraft("");
              }
            }}
            placeholder={
              prompt.mode === "folder" ? t("files.newFolder") : t("files.newFile")
            }
            className="flex-1 rounded-btn bg-surface-2 px-2 py-1 font-mono text-[12px] text-text outline-none"
          />
        </div>
      )}

      {/* entries */}
      <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-1 overflow-y-auto p-3">
        {entries.length === 0 && (
          <p className="col-span-full py-8 text-center font-mono text-xs text-faint">
            {t("files.empty")}
          </p>
        )}
        {entries.map((e) => (
          <button
            key={e.path}
            data-testid={`fm-entry-${e.name}`}
            onDoubleClick={() => onOpenEntry(e)}
            onContextMenu={(ev) => {
              ev.preventDefault();
              ev.stopPropagation(); // don't also trigger the desktop's context menu
              setMenu({ x: ev.clientX, y: ev.clientY, entry: e });
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors hover:bg-white/5",
            )}
          >
            <span className="text-accent">
              <Icon name={e.kind === "dir" ? "folder" : "file"} size={32} />
            </span>
            <span className="line-clamp-2 break-all text-[11px] leading-tight text-text/90">
              {e.name}
            </span>
          </button>
        ))}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: t("files.rename"),
              icon: "pencil",
              onClick: () => {
                setPrompt({ mode: "rename", path: menu.entry.path });
                setDraft(menu.entry.name);
              },
            },
            {
              label: t("files.delete"),
              icon: "trash",
              onClick: () => void remove(menu.entry.path),
            },
            ...topFolders(entriesByDir["/"])
              .filter((folder) => folder.path !== parent(menu.entry.path))
              .map(
                (folder): MenuItem => ({
                  label: `${t("files.move")}: ${folder.name}`,
                  icon: "folder",
                  onClick: () => void move(menu.entry.path, folder.path),
                }),
              ),
          ]}
        />
      )}
    </div>
  );
}
