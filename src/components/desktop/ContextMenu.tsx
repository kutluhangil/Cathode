"use client";

import { useEffect } from "react";

export interface MenuItem {
  label: string;
  onClick: () => void;
  divider?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("blur", close);
    };
  }, [onClose]);

  // ekran taşmasını kabaca önle
  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - items.length * 36 - 16);

  return (
    <div
      role="menu"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[5000] w-52 overflow-hidden rounded-[10px] border border-border bg-glass p-1 shadow-win"
    >
      {items.map((it, i) => (
        <div key={i}>
          {it.divider && i > 0 && (
            <div className="my-1 h-px bg-border-soft" />
          )}
          <button
            role="menuitem"
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className="flex w-full items-center rounded-[6px] px-3 py-2 text-left text-[13px] text-text-dim transition-colors hover:bg-accent/15 hover:text-text"
          >
            {it.label}
          </button>
        </div>
      ))}
    </div>
  );
}
