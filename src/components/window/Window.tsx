"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { getApp } from "@/data/apps";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { windowVariants } from "@/lib/motion";
import { SYSTEM_BAR_H, DOCK_RESERVE } from "@/lib/layout";
import type { WindowInstance } from "@/lib/types";
import { TitleBar } from "./TitleBar";
import { ResizeHandles } from "./ResizeHandles";
import { useWindowResize } from "./useWindowDrag";

interface Props {
  win: WindowInstance;
  active: boolean;
  reduced: boolean;
  mobile?: boolean;
}

export function Window({ win, active, reduced, mobile = false }: Props) {
  const focus = useWindows((s) => s.focus);
  const close = useWindows((s) => s.close);
  const resize = useWindowResize(win.id, win.rect);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const app = getApp(win.appId);
  useFocusTrap(rootRef, active);
  if (!app) return null;
  const Body = app.component;
  const maximized = win.status === "maximized";
  const capturesKeyboard = app.capturesKeyboard ?? false;

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Esc pencereyi kapatır — emülatör pencereleri klavyeyi kendi yönetir
    if (e.key === "Escape" && !capturesKeyboard) {
      e.stopPropagation();
      close(win.id);
    }
  };

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-label={t(win.title)}
      data-testid={`window-${win.appId}`}
      variants={reduced ? undefined : windowVariants}
      initial={reduced ? false : "hidden"}
      animate="visible"
      exit={reduced ? undefined : "exit"}
      onPointerDownCapture={() => focus(win.id)}
      style={
        mobile
          ? {
              left: 0,
              top: SYSTEM_BAR_H + 6,
              width: "100%",
              height: `calc(100% - ${SYSTEM_BAR_H + 6 + DOCK_RESERVE}px)`,
              zIndex: win.z,
            }
          : {
              left: win.rect.x,
              top: win.rect.y,
              width: win.rect.w,
              height: win.rect.h,
              zIndex: win.z,
            }
      }
      className={cn(
        // opak workstation gövdesi — cam yok (spec §4.4)
        "pointer-events-auto absolute flex flex-col overflow-hidden bg-surface",
        mobile || maximized ? "rounded-none" : "rounded-win",
        active
          ? "shadow-win ring-1 ring-border"
          : "shadow-win ring-1 ring-border-soft opacity-[0.97]",
      )}
    >
      <TitleBar win={win} active={active} mobile={mobile} />

      <div className="relative flex-1 overflow-hidden">
        <Body windowId={win.id} {...(win.props ?? {})} />
        <div className="win-noise" aria-hidden />
      </div>

      {!maximized && !mobile && (
        <ResizeHandles
          start={resize.start}
          onPointerMove={resize.onPointerMove}
          onPointerUp={resize.onPointerUp}
        />
      )}
    </motion.div>
  );
}
