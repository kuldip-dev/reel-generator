"use client";

import React from "react";

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  onClick,
  loading,
  disabled,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative w-full py-4 rounded-2xl font-bold text-base tracking-wide
        transition-all duration-200 overflow-hidden
        ${disabled || loading
          ? "bg-white/10 text-white/30 cursor-not-allowed"
          : "bg-linear-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] shadow-lg shadow-violet-900/40"
        }
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-3">
          Generating Video…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
          </svg>
          Generate Reel Video
        </span>
      )}
    </button>
  );
};
