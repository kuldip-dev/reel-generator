"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface AudioConfig {
  file: File;
  audioDataUri: string;
  duration: number;  // total audio file duration in seconds
  cropStart: number; // selected window start (seconds) — cropEnd = cropStart + videoDuration
  cropEnd: number;   // always = cropStart + videoDuration
}

interface AudioSelectorProps {
  /** Exact clip length needed — equals the total video duration */
  videoDuration: number;
  audioConfig: AudioConfig | null;
  onAudioChange: (config: AudioConfig | null) => void;
  onError: (msg: string) => void;
  loadError: string;
  loading: boolean;
  onLoadingChange: (v: boolean) => void;
  isGenerating?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load audio file"));
    });
  });
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read audio file"));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const AudioSelector: React.FC<AudioSelectorProps> = ({
  videoDuration,
  audioConfig,
  onAudioChange,
  onError,
  loadError,
  loading,
  onLoadingChange,
  isGenerating = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // ── Fixed-bar drag state ───────────────────────────────────────────────────
  // Records the pointer position and cropStart value at the moment drag began
  const dragRef = useRef<{ startX: number; startCropStart: number } | null>(null);

  const onBarPointerDown = (e: React.PointerEvent) => {
    if (!audioConfig || isGenerating) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startCropStart: audioConfig.cropStart };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onBarPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !trackRef.current || !audioConfig) return;
    const trackWidth = trackRef.current.getBoundingClientRect().width;
    const dx = e.clientX - dragRef.current.startX;
    const dSec = (dx / trackWidth) * audioConfig.duration;
    const newStart = Math.max(
      0,
      Math.min(dragRef.current.startCropStart + dSec, audioConfig.duration - videoDuration)
    );
    onAudioChange({ ...audioConfig, cropStart: newStart, cropEnd: newStart + videoDuration });
  };

  const onBarPointerUp = () => {
    dragRef.current = null;
  };

  // ── Playback preview ───────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioElRef.current) audioElRef.current.pause();
    setIsPlaying(false);
  }, []);

  // Stop + reset cursor whenever the crop window moves or file changes
  useEffect(() => {
    stopPlayback();
    if (audioConfig) setPlaybackPos(audioConfig.cropStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioConfig?.cropStart, audioConfig?.audioDataUri]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioElRef.current) {
        audioElRef.current.src = "";
        audioElRef.current = null;
      }
    };
  }, [stopPlayback]);

  const togglePlay = useCallback(() => {
    if (!audioConfig) return;
    if (isPlaying) { stopPlayback(); return; }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
    const el = new Audio(audioConfig.audioDataUri);
    audioElRef.current = el;
    el.currentTime = audioConfig.cropStart;

    const { cropStart, cropEnd, duration } = audioConfig;
    const tick = () => {
      if (!audioElRef.current) return;
      const pos = audioElRef.current.currentTime;
      setPlaybackPos(pos);
      if (pos >= cropEnd || pos >= duration) {
        stopPlayback();
        setPlaybackPos(cropStart);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    el.play()
      .then(() => {
        setIsPlaying(true);
        setPlaybackPos(cropStart);
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => setIsPlaying(false));
  }, [audioConfig, isPlaying, stopPlayback]);

  // ── File loading ───────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("audio/")) {
        onError("Please select an audio file (MP3, WAV, AAC, OGG, M4A…)");
        return;
      }
      onLoadingChange(true);
      onError("");
      try {
        const duration = await getAudioDuration(file);
        if (!isFinite(duration) || duration <= 0) {
          throw new Error("Could not determine audio duration — try another file.");
        }
        if (duration < videoDuration) {
          onError(
            `Audio (${formatTime(duration)}) is shorter than the video (${formatTime(videoDuration)}). Please choose a longer file.`
          );
          onLoadingChange(false);
          return;
        }
        const audioDataUri = await readAsDataUri(file);
        onAudioChange({
          file,
          audioDataUri,
          duration,
          cropStart: 0,
          cropEnd: videoDuration,
        });
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to load audio");
      } finally {
        onLoadingChange(false);
      }
    },
    [videoDuration, onAudioChange, onError, onLoadingChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ── Drop-zone (no audio selected) ─────────────────────────────────────────
  if (!audioConfig) {
    return (
      <div className="space-y-2">
        {loadError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {loadError}
          </p>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isGenerating && !loading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-all
            ${isGenerating || loading
              ? "border-white/5 cursor-not-allowed opacity-40"
              : "border-white/15 hover:border-violet-500/50 hover:bg-violet-500/5 cursor-pointer"
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-white/50">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs">Loading audio…</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-xs text-white/50">
                Drop audio here or{" "}
                <span className="text-violet-400 underline-offset-2 underline">browse</span>
              </p>
              <p className="text-[10px] text-white/25 mt-1">
                MP3 · WAV · AAC · OGG · M4A — must be ≥{" "}
                <span className="text-white/40">{formatTime(videoDuration)}</span> long
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleInputChange}
          disabled={isGenerating}
        />
      </div>
    );
  }

  // ── Crop UI (audio loaded) ─────────────────────────────────────────────────
  const { duration, cropStart, cropEnd, file } = audioConfig;

  // Bar geometry — fixed width proportional to videoDuration / total duration
  const barWidthPct = (videoDuration / duration) * 100;
  const barLeftPct = (cropStart / duration) * 100;

  // Playback cursor
  const clampedPos = Math.min(Math.max(playbackPos, cropStart), cropEnd);
  const playbackPct = (clampedPos / duration) * 100;
  const elapsedInClip = Math.max(0, clampedPos - cropStart);

  const isDragging = dragRef.current !== null;

  return (
    <div className="space-y-3">
      {/* File info row */}
      <div className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-xl px-3 py-2">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white font-medium truncate">{file.name}</p>
          <p className="text-[10px] text-white/40">
            Total: {formatTime(duration)} · Using: {formatTime(videoDuration)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => !isGenerating && onAudioChange(null)}
          disabled={isGenerating}
          title="Remove audio"
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Slider */}
      <div>
        <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3">
          Choose audio segment — drag to reposition
        </label>

        {/* Track container */}
        <div ref={trackRef} className="relative select-none" style={{ height: 32 }}>

          {/* Full audio track (dimmed) */}
          <div className="absolute inset-x-0 bg-white/8 rounded-full"
            style={{ top: "50%", transform: "translateY(-50%)", height: 4 }} />

          {/* ── Draggable fixed-width selection ────────────────────────── */}
          <div
            onPointerDown={onBarPointerDown}
            onPointerMove={onBarPointerMove}
            onPointerUp={onBarPointerUp}
            onPointerCancel={onBarPointerUp}
            className={`absolute z-10 ${
              isGenerating
                ? "opacity-40 cursor-not-allowed"
                : isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ left: `${barLeftPct}%`, width: `${barWidthPct}%`, top: 0, bottom: 0 }}
          >
            {/* Filled track strip */}
            <div
              className="absolute inset-x-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full pointer-events-none"
              style={{ top: "50%", transform: "translateY(-50%)", height: 4 }}
            />

            {/* Left edge bar */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)] pointer-events-none"
            />

            {/* Right edge bar */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-1.5 h-5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,72,229,0.8)] pointer-events-none"
            />
          </div>

          {/* Playback cursor */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/90 rounded-full z-20 pointer-events-none"
              style={{ left: `${playbackPct}%`, transform: "translateX(-50%)" }}
            />
          )}
        </div>

        {/* Time labels */}
        {(() => {
          const atStart = cropStart < 0.25;
          const atEnd   = cropEnd > duration - 0.25;
          return (
            <div className="relative mt-1" style={{ height: 16 }}>
              {/* 0:00 — highlighted when bar is flush left, dimmed otherwise */}
              <span
                className={`absolute left-0 text-[10px] tabular-nums font-semibold transition-colors ${
                  atStart ? "text-violet-300" : "text-white/25"
                }`}
              >
                0:00
              </span>

              {/* Start bar label — hidden when bar is flush left */}
              {!atStart && (
                <span
                  className="absolute text-[10px] text-violet-300 font-semibold tabular-nums"
                  style={{ left: `${barLeftPct}%`, transform: "translateX(-50%)" }}
                >
                  {formatTime(cropStart)}
                </span>
              )}

              {/* End bar label — hidden when bar is flush right */}
              {!atEnd && barWidthPct > 8 && (
                <span
                  className="absolute text-[10px] text-fuchsia-300 font-semibold tabular-nums"
                  style={{ left: `${barLeftPct + barWidthPct}%`, transform: "translateX(-50%)" }}
                >
                  {formatTime(cropEnd)}
                </span>
              )}

              {/* Total duration — highlighted when bar is flush right, dimmed otherwise */}
              <span
                className={`absolute right-0 text-[10px] tabular-nums font-semibold transition-colors ${
                  atEnd ? "text-fuchsia-300" : "text-white/25"
                }`}
              >
                {formatTime(duration)}
              </span>
            </div>
          );
        })()}

        {/* Controls row */}
        <div className="flex items-center gap-3 mt-3">

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isGenerating}
            title={isPlaying ? "Pause preview" : "Preview selected segment"}
            className={`
              shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all
              ${isGenerating
                ? "opacity-30 cursor-not-allowed border-white/10 bg-white/3 text-white/30"
                : isPlaying
                  ? "border-violet-400/60 bg-violet-600/25 text-violet-300 hover:bg-violet-600/35"
                  : "border-white/15 bg-white/5 text-white/50 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/10"
              }
            `}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 translate-x-px" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          {/* Time info */}
          <div className="flex-1 flex items-center gap-2 text-[11px]">
            <span className="text-white/50">
              Start: <span className="text-white font-semibold tabular-nums">{formatTime(cropStart)}</span>
            </span>
            <span className="text-white/20">→</span>
            <span className="text-white/50">
              End: <span className="text-white font-semibold tabular-nums">{formatTime(cropEnd)}</span>
            </span>
            {isPlaying && (
              <span className="ml-auto text-violet-300 tabular-nums">
                {formatTime(elapsedInClip)} / {formatTime(videoDuration)}
              </span>
            )}
          </div>

          {/* Duration badge — always fixed */}
          <span className="shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-0.5 border tabular-nums text-violet-300 bg-violet-500/10 border-violet-500/20">
            {formatTime(videoDuration)}
          </span>
        </div>

        <p className="text-[10px] text-white/20 mt-2">
          Slide the bar to choose which part of the audio plays with your video
        </p>
      </div>

      {/* Change file */}
      <button
        type="button"
        onClick={() => !isGenerating && fileInputRef.current?.click()}
        disabled={isGenerating}
        className="text-[11px] text-white/30 hover:text-violet-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed underline-offset-2 hover:underline"
      >
        Change audio file
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={isGenerating}
      />
    </div>
  );
};
