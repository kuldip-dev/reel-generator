"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

// 9:16 is the locked reel aspect ratio
const REEL_ASPECT = 9 / 16;

interface ImageCropperProps {
  /** Object URL of the image to crop */
  imageSrc: string;
  /** Called with the cropped File when the user confirms */
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
  originalFileName: string;
}

/**
 * Applies the pixel-level crop area to the source image using Canvas
 * and returns a JPEG Blob.
 */
async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.95
      );
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onConfirm,
  onCancel,
  originalFileName,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  const onCropComplete = useCallback(
    (_: Area, pixels: Area) => setCroppedAreaPixels(pixels),
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      const baseName = originalFileName.replace(/\.[^.]+$/, "");
      const file = new File([blob], `${baseName}-cropped.jpg`, {
        type: "image/jpeg",
      });
      onConfirm(file);
    } finally {
      setApplying(false);
    }
  };

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-white">Crop Image</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Fixed 9:16 ratio · Pinch or scroll to zoom · Drag to reposition
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Crop area — takes all remaining height */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={REEL_ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: "#000" },
            cropAreaStyle: {
              border: "2px solid rgba(139,92,246,0.9)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            },
          }}
          showGrid
          zoomWithScroll
        />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-white/10 shrink-0 bg-black/40">
        <svg className="w-4 h-4 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-violet-500"
          aria-label="Zoom"
        />
        <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zM11 8v6M8 11h6" />
        </svg>
        <span className="text-xs text-white/40 w-10 text-right">{zoom.toFixed(1)}×</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 py-3 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/30 text-sm font-medium transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={applying}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {applying ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Applying…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply Crop
            </>
          )}
        </button>
      </div>
    </div>
  );
};
