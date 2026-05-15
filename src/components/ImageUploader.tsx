"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImageCropper } from "./ImageCropper";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  isGenerating?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  isGenerating = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

  // Crop modal state
  const [cropIndex, setCropIndex] = useState<number | null>(null);

  // Track which indices have been cropped (for ✓ badge)
  const [croppedSet, setCroppedSet] = useState<Set<number>>(new Set());

  // ─── Non-destructive crop: keep original files separate ───────────────────
  // `originals` mirrors the order of `images` but always holds the raw upload.
  // Cropping updates `images` (sent to the API) but never touches `originals`.
  const [originals, setOriginals] = useState<File[]>([]);

  // When the parent resets images to empty, clear originals too.
  useEffect(() => {
    if (images.length === 0) {
      setOriginals([]);
      setCroppedSet(new Set());
    }
  }, [images.length]);

  // ── Add files ──────────────────────────────────────────────────────────────
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) return;
      const combined = [...images, ...arr].slice(0, 10);
      const combinedOriginals = [...originals, ...arr].slice(0, 10);
      onImagesChange(combined);
      setOriginals(combinedOriginals);
    },
    [images, originals, onImagesChange]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isGenerating) return;
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (isGenerating) return;
    addFiles(e.dataTransfer.files);
  };

  // ── Remove ─────────────────────────────────────────────────────────────────
  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
    setOriginals((prev) => prev.filter((_, i) => i !== index));
    setCroppedSet((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isGenerating) { e.preventDefault(); return; }
    setDragSourceIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // Build a small square drag-ghost so the preview isn't the tall 9:16 card.
    const src = URL.createObjectURL(images[index]);
    const ghost = document.createElement("div");
    ghost.style.cssText =
      "position:fixed;top:-200px;left:-200px;width:64px;height:64px;" +
      "border-radius:10px;overflow:hidden;border:2px solid rgba(139,92,246,0.8);";
    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    ghost.appendChild(img);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 32, 32);
    // Remove after the browser has captured it
    setTimeout(() => {
      document.body.removeChild(ghost);
      URL.revokeObjectURL(src);
    }, 0);
  };

  const handleDropOnThumb = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (isGenerating || dragSourceIndex === null || dragSourceIndex === targetIndex) return;

    // Reorder images
    const reordered = [...images];
    const [movedImg] = reordered.splice(dragSourceIndex, 1);
    reordered.splice(targetIndex, 0, movedImg);
    onImagesChange(reordered);

    // Reorder originals the same way
    const reorderedOriginals = [...originals];
    const [movedOrig] = reorderedOriginals.splice(dragSourceIndex, 1);
    reorderedOriginals.splice(targetIndex, 0, movedOrig);
    setOriginals(reorderedOriginals);

    // Reorder croppedSet indices
    setCroppedSet((prev) => {
      const arr = reordered.map((_, newIdx) => {
        // Map new index back to old index before the drag
        const src = dragSourceIndex;
        const tgt = targetIndex;
        let oldIdx: number;
        if (newIdx === tgt) {
          oldIdx = src;
        } else if (src < tgt && newIdx >= src && newIdx < tgt) {
          oldIdx = newIdx + 1;
        } else if (src > tgt && newIdx > tgt && newIdx <= src) {
          oldIdx = newIdx - 1;
        } else {
          oldIdx = newIdx;
        }
        return prev.has(oldIdx) ? newIdx : -1;
      });
      return new Set(arr.filter((x) => x >= 0));
    });

    setDragSourceIndex(null);
  };

  // ── Crop confirm ───────────────────────────────────────────────────────────
  // Update `images` with the cropped file so the parent/API gets the right data,
  // but leave `originals` untouched so re-opening the cropper shows full image.
  const handleCropConfirm = (croppedFile: File) => {
    if (cropIndex === null) return;
    const updated = [...images];
    updated[cropIndex] = croppedFile;
    onImagesChange(updated);
    setCroppedSet((prev) => new Set(prev).add(cropIndex));
    setCropIndex(null);
  };

  // Object URL for display — uses cropped version for thumbnail, original for cropper
  const getObjectUrl = (file: File) => URL.createObjectURL(file);

  return (
    <>
      {/* ── Drop zone ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div
          role="button"
          tabIndex={isGenerating ? -1 : 0}
          onClick={() => { if (!isGenerating) inputRef.current?.click(); }}
          onKeyDown={(e) => { if (!isGenerating && e.key === "Enter") inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); if (!isGenerating) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            border-2 border-dashed rounded-2xl
            transition-all duration-200 py-10 px-6
            ${isGenerating
              ? "border-white/10 bg-white/3 cursor-not-allowed opacity-50"
              : dragOver
                ? "border-violet-400 bg-violet-900/20 cursor-pointer"
                : "border-white/20 bg-white/5 hover:border-violet-500/60 hover:bg-white/10 cursor-pointer"
            }
          `}
        >
          <svg className="w-12 h-12 mb-3 text-violet-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-white/80 font-medium text-sm">
            {dragOver ? "Drop images here" : "Click or drag images here"}
          </p>
          <p className="text-white/40 text-xs mt-1">
            JPG, PNG, WebP · Max 10 MB each · Up to 10 images
          </p>
          {images.length > 0 && (
            <span className="absolute top-3 right-4 text-xs text-violet-300 font-semibold">
              {images.length}/10
            </span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        {/* ── Thumbnails ─────────────────────────────────────────────────── */}
        {images.length > 0 && (
          <div>
            <p className="text-xs text-white/40 mb-2">
              Drag to reorder · ✂ crop · 🗑 remove
            </p>
            <div className="grid grid-cols-4 gap-3">
              {images.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  draggable={!isGenerating}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnThumb(e, index)}
                  className={`relative aspect-9/16 rounded-xl overflow-hidden border border-white/10 ${isGenerating ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                  style={{ background: "#1a1a2a" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getObjectUrl(file)}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Order badge — top-left */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow pointer-events-none">
                    {index + 1}
                  </div>

                  {/* Crop button — top-right */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (!isGenerating) setCropIndex(index); }}
                    disabled={isGenerating}
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow transition-all ${isGenerating ? "bg-violet-600/30 cursor-not-allowed opacity-40" : "bg-violet-600/90 hover:bg-violet-500 active:scale-95 cursor-pointer"}`}
                    aria-label="Crop image"
                    title="Crop to 9:16"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                  </button>

                  {/* Remove button — bottom-right */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (!isGenerating) removeImage(index); }}
                    disabled={isGenerating}
                    className={`absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow transition-all ${isGenerating ? "bg-red-600/30 cursor-not-allowed opacity-40" : "bg-red-600/90 hover:bg-red-500 active:scale-95 cursor-pointer"}`}
                    aria-label="Remove image"
                    title="Remove"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Cropped badge — bottom-left */}
                  {croppedSet.has(index) && (
                    <div className="absolute bottom-1.5 left-1.5 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded-full font-semibold pointer-events-none">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Crop modal ─────────────────────────────────────────────────────── */}
      {/* Always open with the ORIGINAL file so re-crops start from the full image */}
      {cropIndex !== null && originals[cropIndex] && (
        <ImageCropper
          imageSrc={getObjectUrl(originals[cropIndex])}
          originalFileName={originals[cropIndex].name}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropIndex(null)}
        />
      )}
    </>
  );
};
