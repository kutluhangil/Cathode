"use client";

import { useEffect, useState } from "react";
import { readBlob } from "@/lib/fs/vfs";
import { useT } from "@/lib/i18n/useT";

interface Props {
  windowId: string;
  path?: string;
}

/** Resim görüntüleyici — FS'ten görsel açar (blob URL). */
export function ImageViewer({ path }: Props) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void readBlob(path).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!url) {
    return (
      <div
        data-testid="viewer-empty"
        className="flex h-full items-center justify-center bg-black/60 p-6 text-center font-mono text-xs text-text-dim"
      >
        {t("viewer.empty")}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-black/80 p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="viewer-img"
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain [image-rendering:pixelated]"
      />
    </div>
  );
}
