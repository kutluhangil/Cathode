"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APPS } from "@/data/apps";
import { useWindows } from "@/store/windowsStore";
import { useSettings } from "@/store/settingsStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { BOOT_KEY } from "@/lib/layout";
import { RetrogradeMark, Icon, type IconName } from "@/components/icons";
import { Clock } from "./Clock";

/**
 * Üst sistem çubuğu — gerçek OS hissinin ana taşıyıcısı.
 * Sol: Retrograde sistem menüsü · Sağ: tray (accent, CRT, monitör) + saat.
 */
export function SystemBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = useWindows((s) => s.open);

  const toggleAccent = useSettings((s) => s.toggleAccent);
  const crt = useSettings((s) => s.crt);
  const toggleCrt = useSettings((s) => s.toggleCrt);
  const monitor = useSettings((s) => s.monitor);
  const toggleMonitor = useSettings((s) => s.toggleMonitor);
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const t = useT();

  // dışarı tıklayınca sistem menüsü kapanır
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const openApp = (id: string) => {
    const app = APPS.find((a) => a.id === id);
    if (app) open(app.id, app.name, app.defaultSize);
    setMenuOpen(false);
  };

  const reboot = () => {
    sessionStorage.removeItem(BOOT_KEY);
    location.reload();
  };

  return (
    <div className="system-bar fixed inset-x-0 top-0 z-[2000] flex h-7 items-center justify-between border-b border-border-soft bg-glass px-2">
      {/* sistem menüsü */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={t("systemBar.menu")}
          aria-expanded={menuOpen}
          className={cn(
            "flex h-[22px] items-center gap-1.5 rounded-btn px-2 font-mono text-[12px] transition-colors",
            menuOpen
              ? "bg-surface-3 text-accent"
              : "text-text-dim hover:bg-surface-3 hover:text-text",
          )}
        >
          <span className={cn("text-accent", crt && "phosphor")}>
            <RetrogradeMark size={14} />
          </span>
          Retrograde
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              role="menu"
              className="absolute left-0 top-full mt-1.5 w-52 overflow-hidden rounded-ui bg-surface-2 p-1 shadow-float"
            >
              <SysItem icon="info" label={t("menu.about")} onClick={() => openApp("about")} />
              <SysItem
                icon="settings"
                label={t("menu.settings")}
                onClick={() => openApp("settings")}
              />
              <div className="my-1 h-px bg-border-soft" />
              <SysItem icon="power" label={t("systemBar.reboot")} onClick={reboot} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* tray */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleAccent}
          aria-label={t("systemBar.accent")}
          title={t("systemBar.accentShort")}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-btn transition-colors hover:bg-surface-3"
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{
              background: "var(--accent)",
              boxShadow: "inset 0 1px 0 var(--edge-light), 0 0 5px var(--accent-glow)",
            }}
          />
        </button>
        <TrayToggle
          icon="crt"
          label={t("systemBar.crt")}
          active={crt}
          onClick={toggleCrt}
        />
        <TrayToggle
          icon="monitor"
          label={t("systemBar.monitor")}
          active={monitor}
          onClick={toggleMonitor}
        />
        <button
          onClick={() => setLang(lang === "tr" ? "en" : "tr")}
          aria-label={t("systemBar.language")}
          title={t("systemBar.language")}
          className="flex h-[22px] items-center rounded-btn px-1.5 font-mono text-[11px] text-text-dim transition-colors hover:bg-surface-3 hover:text-text"
        >
          {lang === "tr" ? "TR" : "EN"}
        </button>
        <div className="mx-1.5 h-4 w-px bg-border-soft" />
        <Clock />
      </div>
    </div>
  );
}

function SysItem({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-btn px-2.5 py-1.5 text-left font-mono text-[12px] text-text-dim transition-colors hover:bg-surface-3 hover:text-text"
    >
      <span className="text-faint">
        <Icon name={icon} size={14} />
      </span>
      {label}
    </button>
  );
}

function TrayToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-[22px] w-[22px] items-center justify-center rounded-btn transition-colors",
        active
          ? "text-accent hover:bg-surface-3"
          : "text-faint hover:bg-surface-3 hover:text-text-dim",
      )}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}
