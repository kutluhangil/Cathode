"use client";

import { motion } from "framer-motion";
import { useWindows } from "@/store/windowsStore";
import { getApp } from "@/data/apps";
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
  const app = getApp(win.appId);
  if (!app) return null;
  const Body = app.component;
  const maximized = win.status === "maximized";

  return (
    <motion.div
      role="dialog"
      aria-label={win.title}
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
        "pointer-events-auto absolute flex flex-col overflow-hidden bg-glass",
        maximized ? "rounded-none" : "rounded-win",
        active
          ? "shadow-win ring-[0.5px] ring-accent/40"
          : "shadow-win ring-[0.5px] ring-border",
      )}
    >
      {/* aktif pencerede üstte ince accent çizgisi */}
      <div
        className={cn(
          "h-px w-full shrink-0 transition-opacity",
          active ? "bg-accent opacity-80" : "opacity-0",
        )}
      />
      <TitleBar win={win} glyph={app.glyph} active={active} />

      <div className="relative flex-1 overflow-hidden bg-surface/60">
        <Body windowId={win.id} />
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
