"use client";

import { useEffect, useRef, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { readText, writeText } from "@/lib/fs/vfs";
import { basename } from "@/lib/fs/path";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";
import { FsPicker } from "./fs/FsPicker";

const LEGACY_KEY = "retrograde.notepad";

interface Props {
  windowId: string;
  path?: string; // file to open on launch (from open() props)
}

/** Not defteri — gerçek dosyaları FS'ten açar/kaydeder (OPFS). */
export function Notepad({ path }: Props) {
  const t = useT();
  const createFile = useFiles((s) => s.createFile);
  const [filePath, setFilePath] = useState<string | null>(path ?? null);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<"open" | "save" | null>(null);
  const migrated = useRef(false);

  // launch: load the passed file, or migrate the legacy note once
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (path) {
        const content = await readText(path).catch(() => "");
        if (!cancelled) {
          setText(content);
          setFilePath(path);
          setDirty(false);
        }
        return;
      }
      if (!migrated.current) {
        migrated.current = true;
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const dest = await createFile("/Documents", "notlar.txt", legacy).catch(
            () => null,
          );
          localStorage.removeItem(LEGACY_KEY);
          if (dest && !cancelled) {
            setText(legacy);
            setFilePath(dest);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, createFile]);

  const doSave = async (target: string) => {
    await writeText(target, text);
    setFilePath(target);
    setDirty(false);
  };

  const onSave = () => {
    if (filePath) void doSave(filePath);
    else setPicker("save");
  };

  const title = filePath ? basename(filePath) : t("files.untitled");

  return (
    <div className="relative flex h-full flex-col">
      {/* toolbar */}
      <div className="flex items-center gap-1 border-b border-border-soft px-2 py-1.5">
        <button
          data-testid="np-open"
          onClick={() => setPicker("open")}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="folder" size={13} /> {t("notepad.open")}
        </button>
        <button
          data-testid="np-save"
          onClick={onSave}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          <Icon name="save" size={13} /> {t("notepad.save")}
        </button>
        <button
          data-testid="np-save-as"
          onClick={() => setPicker("save")}
          className="flex h-7 items-center gap-1 rounded-btn px-2 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          {t("notepad.saveAs")}
        </button>
        <span
          data-testid="np-title"
          className="ml-auto truncate font-mono text-[11px] text-faint"
        >
          {title}
          {dirty ? " •" : ""}
        </span>
      </div>

      <textarea
        data-testid="np-textarea"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        spellCheck={false}
        placeholder={t("notepad.placeholder")}
        className="flex-1 resize-none bg-transparent px-5 py-4 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-text-dim/50"
      />

      {picker && (
        <FsPicker
          mode={picker}
          initialName={filePath ? basename(filePath) : ""}
          onCancel={() => setPicker(null)}
          onPick={(r) => {
            setPicker(null);
            if (r.path) {
              const p = r.path;
              void readText(p).then((c) => {
                setText(c);
                setFilePath(p);
                setDirty(false);
              });
            } else if (r.name) {
              void doSave(`${r.dir}/${r.name}`.replace("//", "/"));
            }
          }}
        />
      )}
    </div>
  );
}
