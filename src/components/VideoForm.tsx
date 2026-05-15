"use client";

import React from "react";

interface VideoFormProps {
  title: string;
  subtitle: string;
  durationPerImage: number;
  onTitleChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onDurationChange: (v: number) => void;
}

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

export const VideoForm: React.FC<VideoFormProps> = ({
  title,
  subtitle,
  durationPerImage,
  onTitleChange,
  onSubtitleChange,
  onDurationChange,
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
          Title <span className="normal-case font-normal text-white/30">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Summer Memories"
          maxLength={80}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
          Subtitle <span className="normal-case font-normal text-white/30">(optional)</span>
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="e.g. July 2024"
          maxLength={120}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Duration per image */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
          Duration per Image
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onDurationChange(sec)}
              className={`
                px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                ${durationPerImage === sec
                  ? "border-violet-500 bg-violet-600/30 text-white"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                }
              `}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
