"use client";

import { useEffect } from "react";
import { Icon, type IconName } from "@/components/icons";

export interface MenuItem {
  label: string;
  onClick: () => void;
  divider?: boolean;
  icon?: IconName;
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
      className="fixed z-[5000] w-52 overflow-hidden rounded-ui bg-surface-2 p-1 shadow-float"
    >
      {items.map((it, i) => (
        <div key={i}>
          {it.divider && i > 0 && <div className="my-1 h-px bg-border-soft" />}
          <button
            role="menuitem"
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-btn px-2.5 py-2 text-left font-mono text-[12px] text-text-dim transition-colors hover:bg-surface-3 hover:text-text"
          >
            {it.icon && (
              <span className="text-faint">
                <Icon name={it.icon} size={14} />
              </span>
            )}
            {it.label}
          </button>
        </div>
      ))}
    </div>
  );
}
