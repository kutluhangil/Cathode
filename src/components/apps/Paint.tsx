"use client";

import { useEffect, useRef, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";

const W = 480;
const H = 320;
const BG = "#0a0a0c";
const COLORS = ["#f59e0b", "#22c55e", "#e5e7eb", "#3b82f6", "#ef4444", "#111318"];
const SIZES: Record<string, number> = { S: 2, M: 5, L: 12 };

/** Basit çizim uygulaması — .png olarak /Pictures'a kaydeder. */
export function Paint() {
  const t = useT();
  const writeBlob = useFiles((s) => s.writeBlob);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState("M");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
    }
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const stroke = (to: { x: number; y: number }) => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = color;
    ctx.lineWidth = SIZES[size];
    ctx.lineCap = "round";
    ctx.beginPath();
    const from = last.current ?? to;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  };

  const clear = () => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    setSaved(null);
  };

  const save = () => {
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return;
      const name = `paint-${Math.floor(performance.now() % 100000)}.png`;
      await writeBlob("/Pictures", name, blob);
      setSaved(name);
    }, "image/png");
  };

  return (
    <div className="flex h-full flex-col bg-surface-0">
      <div className="flex items-center gap-2 border-b border-border-soft px-2 py-1.5">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              data-testid={`paint-color-${c}`}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={cn(
                "h-5 w-5 rounded-full border",
                color === c ? "border-accent" : "border-border-soft",
              )}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {Object.keys(SIZES).map((s) => (
            <button
              key={s}
              data-testid={`paint-size-${s}`}
              onClick={() => setSize(s)}
              className={cn(
                "h-6 w-6 rounded-btn font-mono text-[11px]",
                size === s
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-2 text-text-dim",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          data-testid="paint-clear"
          onClick={clear}
          className="ml-auto rounded-btn px-2 py-1 font-mono text-[11px] text-text-dim hover:bg-surface-3 hover:text-text"
        >
          {t("paint.clear")}
        </button>
        <button
          data-testid="paint-save"
          onClick={save}
          className="rounded-btn bg-accent px-2 py-1 font-mono text-[11px] text-accent-ink"
        >
          {t("paint.save")}
        </button>
        {saved && (
          <span data-testid="paint-saved" className="font-mono text-[10px] text-faint">
            {saved}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/50 p-2">
        <canvas
          ref={canvasRef}
          data-testid="paint-canvas"
          width={W}
          height={H}
          onPointerDown={(e) => {
            drawing.current = true;
            last.current = null;
            stroke(pos(e));
          }}
          onPointerMove={(e) => {
            if (drawing.current) stroke(pos(e));
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerLeave={() => {
            drawing.current = false;
            last.current = null;
          }}
          className="max-h-full max-w-full touch-none bg-[#0a0a0c] [image-rendering:pixelated]"
          style={{ aspectRatio: `${W}/${H}` }}
        />
      </div>
    </div>
  );
}
