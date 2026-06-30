"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "cathode.notepad";

/** Basit not defteri — içerik localStorage'da kalıcı (privacy-first, sunucu yok). */
export function Notepad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(localStorage.getItem(KEY) ?? "");
  }, []);

  useEffect(() => {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      localStorage.setItem(KEY, text);
      setSaved(true);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text]);

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="bir şeyler yaz…"
        className="flex-1 resize-none bg-transparent px-5 py-4 font-mono text-sm leading-relaxed text-text outline-none placeholder:text-text-dim/50"
      />
      <div className="flex items-center justify-between border-t border-border-soft px-4 py-2 font-mono text-[11px] text-text-dim">
        <span>{text.length} karakter</span>
        <span className={saved ? "text-text-dim" : "text-accent"}>
          {saved ? "kaydedildi" : "kaydediliyor…"}
        </span>
      </div>
    </div>
  );
}
