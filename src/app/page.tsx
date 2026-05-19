"use client";

import React, { useState, useEffect, useRef } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { EffectSelector } from "@/components/EffectSelector";
import { GenerateButton } from "@/components/GenerateButton";
import { AudioSelector, type AudioConfig } from "@/components/AudioSelector";
import { renderReelVideoClient } from "@/lib/renderVideoClient";
import {
  validateVideoFormData,
  type Effect,
  type TextOverlayConfig,
} from "@/lib/validation";

type AppState = "idle" | "generating" | "done" | "error";

export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [overlays, setOverlays] = useState<TextOverlayConfig[]>([]);
  const [durationPerImage, setDurationPerImage] = useState(3);

  const [audioConfig, setAudioConfig] = useState<AudioConfig | null>(null);
  const [audioLoadError, setAudioLoadError] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);

  const [appState, setAppState] = useState<AppState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const objectUrlRef = useRef<string | null>(null);

  const hasUnsavedWork = images.length > 0 || (appState === "done" && !hasDownloaded);
  const unsavedRef = useRef(hasUnsavedWork);

  useEffect(() => {
    unsavedRef.current = hasUnsavedWork;
  }, [hasUnsavedWork]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!unsavedRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const revokeDownloadUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setDownloadUrl("");
  };

  const handleImagesChange = (newImages: File[]) => {
    setImages(newImages);
    setEffects((prev) => newImages.map((_, i) => prev[i] ?? "fade"));
    setOverlays((prev) => newImages.map((_, i) => prev[i] ?? {}));
  };

  const estimatedDuration = images.length * durationPerImage;

  // Keep audio crop window in sync whenever video duration changes
  useEffect(() => {
    if (!audioConfig || estimatedDuration <= 0) return;

    const newEnd = audioConfig.cropStart + estimatedDuration;

    if (newEnd > audioConfig.duration) {
      // Audio is now too short — clear it and surface an error
      setAudioConfig(null);
      setAudioLoadError(
        `Audio is too short for the new video duration (${estimatedDuration}s). Please choose a longer file.`
      );
      return;
    }

    // Auto-adjust cropEnd to match new video duration
    if (audioConfig.cropEnd !== newEnd) {
      setAudioConfig({ ...audioConfig, cropEnd: newEnd });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedDuration]);

  const canGenerate = images.length > 0 && appState !== "generating";

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const validation = validateVideoFormData({
      images,
      overlays,
      effects,
      durationPerImage,
      backgroundStyle: "blur",
      audioConfig,
    });

    if (!validation.valid) {
      setErrorMessage(validation.error ?? "Invalid form data.");
      setAppState("error");
      return;
    }

    setAppState("generating");
    setErrorMessage("");
    revokeDownloadUrl();
    setHasDownloaded(false);
    setRenderProgress(0);

    const outputName = `reel-${Date.now()}.mp4`;
    setFileName(outputName);

    try {
      const { objectUrl } = await renderReelVideoClient({
        images,
        overlays,
        effects,
        durationPerImage,
        backgroundStyle: "blur",
        onProgress: (p) => setRenderProgress(Math.round(p * 100)),
        ...(audioConfig
          ? {
              audioDataUri: audioConfig.audioDataUri,
              audioCropStart: audioConfig.cropStart,
            }
          : {}),
      });

      objectUrlRef.current = objectUrl;
      setDownloadUrl(objectUrl);
      setAppState("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setAppState("error");
    }
  };

  const handleDownload = () => {
    setHasDownloaded(true);
    // Let the browser start the download before revoking the blob URL
    setTimeout(() => revokeDownloadUrl(), 2000);
  };

  const handleReset = () => {
    revokeDownloadUrl();
    setImages([]);
    setEffects([]);
    setOverlays([]);
    setDurationPerImage(3);
    setAudioConfig(null);
    setAudioLoadError("");
    setAudioLoading(false);
    setAppState("idle");
    setErrorMessage("");
    setFileName("");
    setHasDownloaded(false);
    setRenderProgress(0);
  };

  const isGenerating = appState === "generating";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white">Reel Generator</h1>
          <p className="text-[11px] text-white/40">Rendered in your browser · 1080×1920 · MP4</p>
        </div>
        <div className="ml-auto">
          <span className="text-[11px] bg-violet-600/20 text-violet-300 border border-violet-600/30 rounded-full px-3 py-1">
            Vercel-ready
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start gap-2 bg-amber-900/15 border border-amber-500/25 rounded-xl px-4 py-3 text-xs text-amber-200/80">
          <span className="shrink-0">ℹ</span>
          <p>
            Video is rendered on your device (no server storage). Use{" "}
            <strong className="text-amber-100">Chrome or Edge</strong> for best results.
            Refreshing the page removes the download link.
          </p>
        </div>

        <section className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <SectionLabel number={1} label="Upload Images" subtitle="3–10 images recommended" />
          <ImageUploader images={images} onImagesChange={handleImagesChange} isGenerating={isGenerating} />
        </section>

        <section className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <SectionLabel number={2} label="Effects & Duration" subtitle="Per-image animation and timing" />
          <EffectSelector
            images={images}
            effects={effects}
            overlays={overlays}
            durationPerImage={durationPerImage}
            onEffectsChange={setEffects}
            onOverlaysChange={setOverlays}
            onDurationChange={setDurationPerImage}
            isGenerating={isGenerating}
          />
        </section>

        {/* Section 3 — Audio (unlocked after images + duration are set) */}
        {images.length > 0 && (
          <section
            className={`bg-white/3 border rounded-2xl p-5 transition-all ${
              audioConfig
                ? "border-violet-500/30"
                : "border-white/8"
            }`}
          >
            <SectionLabel
              number={3}
              label="Add Audio"
              subtitle={`Optional background music — must be ≥ ${estimatedDuration}s`}
              badge={audioConfig ? "Added" : "Optional"}
            />
            <AudioSelector
              videoDuration={estimatedDuration}
              audioConfig={audioConfig}
              onAudioChange={(cfg) => {
                setAudioConfig(cfg);
                setAudioLoadError("");
              }}
              onError={setAudioLoadError}
              loadError={audioLoadError}
              loading={audioLoading}
              onLoadingChange={setAudioLoading}
              isGenerating={isGenerating}
            />
          </section>
        )}

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs">
            <Pill icon="🖼" label={`${images.length} image${images.length !== 1 ? "s" : ""}`} />
            <Pill icon="⏱" label={`~${estimatedDuration}s video`} />
            <Pill icon="📐" label="1080 × 1920" />
            {audioConfig && (
              <Pill icon="🎵" label={`Audio · ${audioConfig.file.name.split(".").slice(0, -1).join(".").slice(0, 20)}`} />
            )}
          </div>
        )}

        {appState === "error" && (
          <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-2xl px-4 py-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-300 text-sm font-semibold">Generation Failed</p>
              <p className="text-red-300/70 text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {appState === "generating" && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Rendering your reel…</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {renderProgress}% — keep this tab open
                </p>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(renderProgress, 2)}%` }}
              />
            </div>
          </div>
        )}

        {appState === "done" && (
          <div className="bg-emerald-900/15 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Your reel is ready!</p>
                <p className="text-white/40 text-xs">{fileName}</p>
              </div>
            </div>

            {hasDownloaded ? (
              <div className="flex items-center gap-2 justify-center py-2 text-emerald-400/70 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Downloaded — link removed from this session
              </div>
            ) : (
              <>
                <a
                  href={downloadUrl}
                  download={fileName}
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download MP4
                </a>
                <p className="text-center text-amber-400/60 text-xs mt-2">
                  Download before refreshing — the link is not saved
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <GenerateButton
              onClick={handleGenerate}
              loading={appState === "generating"}
              disabled={!canGenerate}
            />
          </div>
          {(images.length > 0 || appState !== "idle") && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <p className="text-center text-white/20 text-xs pb-4">
          Images stay on your device · Video exists only in this browser tab until downloaded
        </p>
      </div>
    </main>
  );
}

function SectionLabel({
  number,
  label,
  subtitle,
  badge,
}: {
  number: number;
  label: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[11px] font-bold text-violet-300 shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">{label}</h2>
          {badge && (
            <span
              className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                badge === "Added"
                  ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
                  : "text-white/30 bg-white/5 border-white/10"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-white/40">{subtitle}</p>}
      </div>
    </div>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-full px-3 py-1 text-white/60">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
