"use client";

import { motion } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { getApp } from "@/data/apps";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { windowVariants } from "@/lib/motion";
import type { WindowInstance } from "@/lib/types";
import { TitleBar } from "./TitleBar";
import { ResizeHandles } from "./ResizeHandles";
import { useWindowResize } from "./useWindowDrag";

interface Props {
  win: WindowInstance;
  active: boolean;
  reduced: boolean;
}

export function Window({ win, active, reduced }: Props) {
  const focus = useWindows((s) => s.focus);
  const resize = useWindowResize(win.id, win.rect);
  const t = useT();
  const app = getApp(win.appId);
  if (!app) return null;
  const Body = app.component;
  const maximized = win.status === "maximized";

  return (
    <motion.div
      role="dialog"
      aria-label={t(win.title)}
      variants={reduced ? undefined : windowVariants}
      initial={reduced ? false : "hidden"}
      animate="visible"
      exit={reduced ? undefined : "exit"}
      onPointerDownCapture={() => focus(win.id)}
      style={{
        left: win.rect.x,
        top: win.rect.y,
        width: win.rect.w,
        height: win.rect.h,
        zIndex: win.z,
      }}
      className={cn(
        // opak workstation gövdesi — cam yok (spec §4.4)
        "pointer-events-auto absolute flex flex-col overflow-hidden bg-surface",
        maximized ? "rounded-none" : "rounded-win",
        active
          ? "shadow-win ring-1 ring-border"
          : "shadow-win ring-1 ring-border-soft opacity-[0.97]",
      )}
    >
      <TitleBar win={win} active={active} />

      <div className="relative flex-1 overflow-hidden">
        <Body windowId={win.id} />
        <div className="win-noise" aria-hidden />
      </div>

      {!maximized && (
        <ResizeHandles
          start={resize.start}
          onPointerMove={resize.onPointerMove}
          onPointerUp={resize.onPointerUp}
        />
      )}
    </motion.div>
  );
}
