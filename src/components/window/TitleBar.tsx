"use client";

import { useWindows } from "@/store/windowsStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { AppIcon } from "@/components/ui/AppIcon";
import { Icon, type IconName } from "@/components/icons";
import { useWindowMove } from "./useWindowDrag";
import type { WindowInstance } from "@/lib/types";

interface Props {
  win: WindowInstance;
  active: boolean;
  mobile?: boolean;
}

/**
 * Workstation başlık çubuğu: app ikonu + mono başlık + kare makine-butonlar.
 * Aktif pencerede altta 1px fosfor çizgi; pasif tümüyle sönük.
 */
export function TitleBar({ win, active, mobile = false }: Props) {
  const move = useWindowMove(win.id, win.rect);
  const minimize = useWindows((s) => s.minimize);
  const toggleMaximize = useWindows((s) => s.toggleMaximize);
  const close = useWindows((s) => s.close);
  const maximized = win.status === "maximized";
  const t = useT();

  return (
    <div className="shrink-0">
      <div
        data-testid={`titlebar-${win.appId}`}
        onPointerDown={mobile ? undefined : move.onPointerDown}
        onPointerMove={mobile ? undefined : move.onPointerMove}
        onPointerUp={mobile ? undefined : move.onPointerUp}
        onDoubleClick={mobile ? undefined : () => toggleMaximize(win.id)}
        className={cn(
          "flex h-8 select-none items-center gap-2 px-2.5",
          mobile ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
      >
        <span className={cn(!active && "opacity-50 saturate-50")} aria-hidden>
          <AppIcon app={{ id: win.appId }} size={16} />
        </span>
        <span
          className={cn(
            "flex-1 truncate font-mono text-[12px]",
            active ? "text-text" : "text-faint",
          )}
        >
          {t(win.title)}
        </span>

        <div className="flex items-center gap-1">
          <WinBtn label={t("common.minimize")} icon="minimize" onClick={() => minimize(win.id)} />
          <WinBtn
            label={maximized ? t("common.restore") : t("common.maximize")}
            icon={maximized ? "restore" : "maximize"}
            onClick={() => toggleMaximize(win.id)}
          />
          <WinBtn
            label={t("common.close")}
            icon="close"
            onClick={() => close(win.id)}
            testId={`window-close-${win.appId}`}
            className="hover:bg-danger/90 hover:text-white"
          />
        </div>
      </div>

      {/* aktif pencere göstergesi — title bar altı fosfor çizgi */}
      <div
        className={cn(
          "h-px w-full transition-colors duration-200",
          active ? "bg-accent shadow-glow" : "bg-border-soft",
        )}
      />
    </div>
  );
}

function WinBtn({
  label,
  icon,
  onClick,
  className,
  testId,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex h-[22px] w-[22px] items-center justify-center rounded-btn text-text-dim transition-colors duration-150 hover:bg-surface-3 hover:text-text",
        className,
      )}
    >
      <Icon name={icon} size={12} />
    </button>
  );
}
