"use client";

import { useEffect, useRef, useState } from "react";
import { useFiles } from "@/store/filesStore";
import { useT } from "@/lib/i18n/useT";
import { useMotionEnabled } from "@/lib/motion";
import { isAudio } from "@/lib/fs/kind";
import { readBlob } from "@/lib/fs/vfs";
import { parent } from "@/lib/fs/path";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import type { FsEntry } from "@/lib/fs/types";

interface Props {
  windowId: string;
  path?: string;
}

const MUSIC_DIR = "/Music";

const fmt = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

/** Retro medya oynatıcı — VFS'teki ses dosyaları + Web Audio fosfor osiloskopu. */
export function MediaPlayer({ path }: Props) {
  const t = useT();
  const motionOn = useMotionEnabled();
  const dir = path ? parent(path) : MUSIC_DIR;
  const entries = useFiles((s) => s.entriesByDir[dir]);
  const refresh = useFiles((s) => s.refresh);
  const createDir = useFiles((s) => s.createDir);
  const importFiles = useFiles((s) => s.importFiles);
  const tracks = (entries ?? []).filter((e): e is FsEntry => e.kind === "file" && isAudio(e.name));

  const [current, setCurrent] = useState<string | null>(path ?? null);
  // dosyadan açıldıysa (çift tık = kullanıcı etkileşimi) hemen çal
  const [playing, setPlaying] = useState(!!path);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode } | null>(null);

  useEffect(() => {
    void (async () => {
      if (dir === MUSIC_DIR) await createDir("/", "Music"); // mevcutsa no-op
      await refresh(dir);
    })();
  }, [dir, refresh, createDir]);

  // seçili parçayı blob URL olarak yükle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    let url: string | null = null;
    let cancelled = false;
    setError(false);
    void readBlob(current).then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      audio.src = url;
      if (playing) {
        ensureGraph();
        void graphRef.current?.ctx.resume();
        void audio.play().catch(() => setPlaying(false));
      }
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // playing bilerek dahil değil: yalnız parça değişince yükle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // pencere kapanınca ses grafiğini kapat
  useEffect(() => () => void graphRef.current?.ctx.close(), []);

  // osiloskop çizimi — yalnız çalarken ve hareket açıkken animasyonlu
  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !g) return;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#ffb000";
    const buf = new Uint8Array(1024);
    let raf = 0;
    const draw = () => {
      const { width: w, height: h } = canvas;
      g.shadowBlur = 0; // parlama yalnız çizgiye — dolguya uygulanırsa ekran amber'e boyanır
      g.fillStyle = "rgba(5,5,6,0.35)"; // fosfor izi: tam silme yerine soluk kaplama
      g.fillRect(0, 0, w, h);
      const analyser = graphRef.current?.analyser;
      if (analyser && playing) analyser.getByteTimeDomainData(buf);
      else buf.fill(128);
      g.strokeStyle = accent;
      g.lineWidth = 2;
      g.shadowColor = accent;
      g.shadowBlur = 8;
      g.beginPath();
      for (let i = 0; i < buf.length; i++) {
        const x = (i / (buf.length - 1)) * w;
        const y = (buf[i] / 255) * h;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.stroke();
      if (playing && motionOn) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [playing, motionOn]);

  /** AudioContext yalnız kullanıcı etkileşiminde kurulabilir (autoplay politikası). */
  const ensureGraph = () => {
    const audio = audioRef.current;
    if (!audio || graphRef.current) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(ctx.destination);
    graphRef.current = { ctx, analyser };
  };

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!current && tracks[0]) {
      setPlaying(true);
      setCurrent(tracks[0].path);
      ensureGraph();
      return;
    }
    if (playing) {
      audio.pause();
      return;
    }
    ensureGraph();
    await graphRef.current?.ctx.resume();
    await audio.play().catch(() => setError(true));
  };

  const step = (delta: number) => {
    if (!tracks.length) return;
    const i = tracks.findIndex((tr) => tr.path === current);
    const next = tracks[(i + delta + tracks.length) % tracks.length];
    setPlaying(true);
    ensureGraph();
    setCurrent(next.path);
  };

  const addFiles = (files: File[]) => {
    const audio = files.filter((f) => isAudio(f.name));
    if (audio.length) void importFiles(dir, audio);
  };

  const ctl =
    "flex h-8 w-8 items-center justify-center rounded-btn border border-border-soft text-text-dim transition-colors hover:border-accent hover:text-accent disabled:opacity-40";
  const name = current?.split("/").pop();

  return (
    <div
      className={cn("flex h-full flex-col bg-[#08080a]", dragOver && "outline-dashed outline-2 -outline-offset-4 outline-accent/60")}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <audio
        ref={audioRef}
        data-testid="player-audio"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => step(1)}
        onError={() => {
          setError(true);
          setPlaying(false);
        }}
      />

      {/* osiloskop ekranı */}
      <div className="relative border-b border-border-soft">
        <canvas ref={canvasRef} width={640} height={140} className="block h-[140px] w-full" />
        <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between font-mono text-[11px]">
          <span data-testid="player-title" className="phosphor truncate text-accent">
            {error ? t("player.unsupported") : (name ?? "—")}
          </span>
          <span className="tabular-nums text-text-dim">
            {fmt(time)} / {fmt(duration)}
          </span>
        </div>
      </div>

      {/* kontroller */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button aria-label={t("player.prev")} className={ctl} onClick={() => step(-1)} disabled={!tracks.length}>
          <Icon name="chevron-left" size={14} />
        </button>
        <button
          data-testid="player-toggle"
          aria-label={playing ? t("player.pause") : t("player.play")}
          className={cn(ctl, "w-10 text-accent")}
          onClick={() => void toggle()}
          disabled={!tracks.length && !current}
        >
          <span className="font-mono text-[13px]">{playing ? "❚❚" : "▶"}</span>
        </button>
        <button
          aria-label={t("player.next")}
          className={cn(ctl, "[&>*]:-scale-x-100")}
          onClick={() => step(1)}
          disabled={!tracks.length}
        >
          <Icon name="chevron-left" size={14} />
        </button>
        <input
          type="range"
          aria-label={t("player.seek")}
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => {
            if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
          }}
          className="flex-1 accent-[var(--accent)]"
        />
        <span className="text-text-dim">
          <Icon name="sound" size={14} />
        </span>
        <input
          type="range"
          aria-label={t("player.volume")}
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 accent-[var(--accent)]"
        />
        <button aria-label={t("player.add")} title={t("player.add")} className={ctl} onClick={() => uploadRef.current?.click()}>
          <Icon name="upload" size={14} />
        </button>
        <input
          ref={uploadRef}
          data-testid="player-upload"
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = "";
            addFiles(picked);
          }}
        />
      </div>

      {/* çalma listesi */}
      <ol className="flex-1 overflow-y-auto px-2 pb-2 font-mono text-[12px]">
        {tracks.length === 0 && <li className="px-2 py-6 text-center text-faint">{t("player.empty")}</li>}
        {tracks.map((tr, i) => (
          <li key={tr.path}>
            <button
              data-testid={`player-track-${tr.name}`}
              onDoubleClick={() => {
                setPlaying(true);
                ensureGraph();
                setCurrent(tr.path);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-[6px] px-2 py-1 text-left hover:bg-white/5",
                tr.path === current ? "text-accent" : "text-text/85",
              )}
            >
              <span className="w-5 text-right text-faint">{i + 1}</span>
              <span className="truncate">{tr.name}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
