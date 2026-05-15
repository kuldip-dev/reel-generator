"use client";

import React, { useState } from "react";
import Select, { type StylesConfig, type SingleValue } from "react-select";
import type { Effect, TextPosition, TextAnimation, TextOverlayConfig } from "@/lib/validation";
import { TITLE_MAX_CHARS, SUBTITLE_MAX_CHARS } from "@/lib/validation";

// ─────────────────────────────────────────────────────────────────────────────
// Effect options
// ─────────────────────────────────────────────────────────────────────────────
export interface EffectOption {
  value: Effect;
  label: string;
  icon: string;
}

export const EFFECT_OPTIONS: EffectOption[] = [
  { value: "fade",           label: "Fade In / Out",     icon: "✦"  },
  { value: "zoom-in",        label: "Zoom In",           icon: "⊕"  },
  { value: "zoom-out",       label: "Zoom Out",          icon: "⊖"  },
  { value: "ken-burns",      label: "Ken Burns",         icon: "◎"  },
  { value: "slide-up",       label: "Slide Up",          icon: "↑"  },
  { value: "slide-down",     label: "Slide Down",        icon: "↓"  },
  { value: "slide-left",     label: "Slide Left",        icon: "←"  },
  { value: "slide-right",    label: "Slide Right",       icon: "→"  },
  { value: "scale-pop",      label: "Scale Pop",         icon: "◉"  },
  { value: "blur-to-focus",  label: "Blur to Focus",     icon: "◌"  },
  { value: "focus-to-blur",  label: "Focus to Blur",     icon: "●"  },
  { value: "rotate-in",      label: "Rotate In",         icon: "↻"  },
  { value: "flip-3d",        label: "3D Flip",           icon: "⟲"  },
  { value: "parallax",       label: "Parallax",          icon: "⟺"  },
  { value: "pan-left",       label: "Pan Left → Right",  icon: "⟶"  },
  { value: "pan-right",      label: "Pan Right → Left",  icon: "⟵"  },
  { value: "cross-dissolve", label: "Cross Dissolve",    icon: "⊛"  },
  { value: "wipe",           label: "Wipe",              icon: "▶"  },
  { value: "flash",          label: "Camera Flash",      icon: "✺"  },
  { value: "glitch",         label: "Glitch",            icon: "⚡" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Text animation options
// ─────────────────────────────────────────────────────────────────────────────
interface TextAnimOption {
  value: TextAnimation;
  label: string;
  icon: string;
}

const TEXT_ANIM_OPTIONS: TextAnimOption[] = [
  { value: "none",          label: "None",          icon: "○"  },
  { value: "fade",          label: "Fade",          icon: "✦"  },
  { value: "slide-up",      label: "Slide Up",      icon: "↑"  },
  { value: "slide-down",    label: "Slide Down",    icon: "↓"  },
  { value: "slide-left",    label: "Slide Left",    icon: "←"  },
  { value: "slide-right",   label: "Slide Right",   icon: "→"  },
  { value: "scale-pop",     label: "Scale Pop",     icon: "◉"  },
  { value: "blur-to-focus", label: "Blur to Focus", icon: "◌"  },
  { value: "zoom-in",       label: "Zoom In",       icon: "⊕"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Position options
// ─────────────────────────────────────────────────────────────────────────────
interface PositionOption {
  value: TextPosition;
  label: string;
  icon: string;
}

const POSITION_OPTIONS: PositionOption[] = [
  { value: "top-left",      label: "Top Left",      icon: "↖" },
  { value: "top-center",    label: "Top Center",    icon: "↑" },
  { value: "top-right",     label: "Top Right",     icon: "↗" },
  { value: "center",        label: "Center",        icon: "⊕" },
  { value: "bottom-left",   label: "Bottom Left",   icon: "↙" },
  { value: "bottom-center", label: "Bottom Center", icon: "↓" },
  { value: "bottom-right",  label: "Bottom Right",  icon: "↘" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared dark react-select styles
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function darkSelectStyles(disabled: boolean): StylesConfig<any, false> {
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
      borderColor: disabled
        ? "rgba(255,255,255,0.05)"
        : state.isFocused ? "#7c3aed" : "rgba(255,255,255,0.12)",
      borderRadius: "0.75rem",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(124,58,237,0.35)" : "none",
      minHeight: "32px",
      fontSize: "12px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      "&:hover": { borderColor: disabled ? "rgba(255,255,255,0.05)" : "#7c3aed" },
    }),
    valueContainer: (base) => ({ ...base, padding: "1px 10px" }),
    singleValue: (base) => ({ ...base, color: "#ffffff", fontSize: "12px" }),
    placeholder: (base) => ({ ...base, color: "rgba(255,255,255,0.3)", fontSize: "12px" }),
    input: (base) => ({ ...base, color: "#ffffff", fontSize: "12px" }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1a1a2e",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "0.75rem",
      overflow: "hidden",
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menuList: (base) => ({ ...base, padding: "4px", maxHeight: "200px" }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "rgba(124,58,237,0.35)"
        : state.isFocused ? "rgba(255,255,255,0.07)" : "transparent",
      color: state.isSelected ? "#ffffff" : "rgba(255,255,255,0.75)",
      borderRadius: "0.5rem",
      padding: "7px 12px",
      cursor: "pointer",
      fontSize: "12px",
      "&:active": { backgroundColor: "rgba(124,58,237,0.45)" },
    }),
    dropdownIndicator: (base) => ({ ...base, color: "rgba(255,255,255,0.35)", "&:hover": { color: "#fff" } }),
    clearIndicator: (base) => ({ ...base, color: "rgba(255,255,255,0.35)", "&:hover": { color: "#fff" } }),
    indicatorSeparator: () => ({ display: "none" }),
  };
}

const formatOptionLabel = (opt: { icon: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className="text-xs">{opt.icon}</span>
    <span>{opt.label}</span>
  </span>
);

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface EffectSelectorProps {
  images: File[];
  effects: Effect[];
  overlays: TextOverlayConfig[];
  durationPerImage: number;
  onEffectsChange: (effects: Effect[]) => void;
  onOverlaysChange: (overlays: TextOverlayConfig[]) => void;
  onDurationChange: (seconds: number) => void;
  isGenerating?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const EffectSelector: React.FC<EffectSelectorProps> = ({
  images,
  effects,
  overlays,
  durationPerImage,
  onEffectsChange,
  onOverlaysChange,
  onDurationChange,
  isGenerating = false,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const styles = darkSelectStyles(isGenerating);

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const applyToAll = (e: Effect) => onEffectsChange(images.map(() => e));
  const applyTextAnimToAll = (anim: TextAnimation) =>
    onOverlaysChange(overlays.map((o) => ({ ...o, textAnimation: anim })));

  const setImageEffect = (index: number, e: Effect) => {
    const updated = [...effects];
    updated[index] = e;
    onEffectsChange(updated);
  };

  const setOverlayField = (
    index: number,
    field: keyof TextOverlayConfig,
    value: string
  ) => {
    const updated = [...overlays];
    updated[index] = { ...updated[index], [field]: value };
    onOverlaysChange(updated);
  };

  const globalEffect =
    effects.length > 0 && effects.every((e) => e === effects[0])
      ? effects[0]
      : null;

  const globalTextAnim: TextAnimation | null =
    overlays.length > 0 && overlays.every((o) => (o.textAnimation ?? "none") === (overlays[0].textAnimation ?? "none"))
      ? (overlays[0].textAnimation ?? "none")
      : null;

  return (
    <div className="space-y-5">

      {/* ── Apply to All — image effects ─────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Apply Effect to All Images
        </label>
        <Select<EffectOption, false>
          options={EFFECT_OPTIONS}
          value={globalEffect ? EFFECT_OPTIONS.find((o) => o.value === globalEffect) ?? null : null}
          onChange={(opt: SingleValue<EffectOption>) => {
            if (opt) applyToAll(opt.value);
          }}
          placeholder="Select an effect for all images…"
          styles={styles}
          formatOptionLabel={formatOptionLabel}
          isSearchable
          isDisabled={isGenerating}
          instanceId="apply-all-effect"
          menuPortalTarget={portalTarget}
          menuPosition="fixed"
        />
      </div>

      {/* ── Apply to All — text animations ───────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Apply Text Animation to All Images
        </label>
        <Select<TextAnimOption, false>
          options={TEXT_ANIM_OPTIONS}
          value={globalTextAnim !== null ? TEXT_ANIM_OPTIONS.find((o) => o.value === globalTextAnim) ?? null : null}
          onChange={(opt: SingleValue<TextAnimOption>) => {
            if (opt) applyTextAnimToAll(opt.value as TextAnimation);
          }}
          placeholder="Select a text animation for all…"
          styles={styles}
          formatOptionLabel={formatOptionLabel}
          isSearchable={false}
          isDisabled={isGenerating}
          instanceId="apply-all-text-anim"
          menuPortalTarget={portalTarget}
          menuPosition="fixed"
        />
      </div>

      {/* ── Per-Image rows ───────────────────────────────────── */}
      {images.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
            Per-Image Settings
          </label>

          <div
            className="space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: images.length > 5 ? "480px" : "none" }}
          >
            {images.map((file, index) => {
              const current = effects[index] ?? "fade";
              const currentOption = EFFECT_OPTIONS.find((o) => o.value === current) ?? null;
              const overlay = overlays[index] ?? {};
              const isExpanded = expandedRows.has(index);
              const hasText = !!(overlay.title?.trim() || overlay.subtitle?.trim());

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="bg-white/3 border border-white/8 rounded-xl overflow-hidden"
                >
                  {/* ── Row header: thumbnail + index + effect + text toggle ── */}
                  <div className="flex items-center gap-3 p-2">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-9 h-[52px] rounded-lg overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`img ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Index */}
                    <span className="shrink-0 text-[11px] text-white/40 font-semibold w-4">
                      {index + 1}
                    </span>

                    {/* Effect dropdown */}
                    <div className="flex-1 min-w-0">
                      <Select<EffectOption, false>
                        options={EFFECT_OPTIONS}
                        value={currentOption}
                        onChange={(opt: SingleValue<EffectOption>) => {
                          if (opt) setImageEffect(index, opt.value);
                        }}
                        styles={styles}
                        formatOptionLabel={formatOptionLabel}
                        isSearchable={false}
                        isDisabled={isGenerating}
                        instanceId={`effect-${index}`}
                        menuPortalTarget={portalTarget}
                        menuPosition="fixed"
                      />
                    </div>

                    {/* Text overlay toggle */}
                    <button
                      type="button"
                      onClick={() => toggleRow(index)}
                      disabled={isGenerating}
                      title="Text overlay"
                      className={`
                        shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-all text-[11px] font-bold
                        ${isGenerating ? "opacity-30 cursor-not-allowed border-white/10 bg-transparent text-white/40" :
                          isExpanded || hasText
                            ? "border-violet-500/60 bg-violet-600/20 text-violet-300 cursor-pointer"
                            : "border-white/15 bg-white/5 text-white/40 hover:border-violet-500/40 hover:text-violet-300 cursor-pointer"
                        }
                      `}
                    >
                      T
                    </button>
                  </div>

                  {/* ── Expandable overlay fields ─────────────────────────── */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-white/6 pt-2.5">

                      {/* Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Title</span>
                          <span className={`text-[10px] tabular-nums ${(overlay.title?.length ?? 0) >= TITLE_MAX_CHARS ? "text-red-400" : "text-white/25"}`}>
                            {overlay.title?.length ?? 0}/{TITLE_MAX_CHARS}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={overlay.title ?? ""}
                          onChange={(e) => setOverlayField(index, "title", e.target.value.slice(0, TITLE_MAX_CHARS))}
                          disabled={isGenerating}
                          placeholder="e.g. Summer Highlights"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Description</span>
                          <span className={`text-[10px] tabular-nums ${(overlay.subtitle?.length ?? 0) >= SUBTITLE_MAX_CHARS ? "text-red-400" : "text-white/25"}`}>
                            {overlay.subtitle?.length ?? 0}/{SUBTITLE_MAX_CHARS}
                          </span>
                        </div>
                        <textarea
                          value={overlay.subtitle ?? ""}
                          onChange={(e) => setOverlayField(index, "subtitle", e.target.value.slice(0, SUBTITLE_MAX_CHARS))}
                          disabled={isGenerating}
                          placeholder="e.g. A collection of our best moments"
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Position + Text Animation — side by side */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">
                            Text Position
                          </span>
                          <Select<PositionOption, false>
                            options={POSITION_OPTIONS}
                            value={
                              POSITION_OPTIONS.find((o) => o.value === (overlay.textPosition ?? "bottom-center")) ?? null
                            }
                            onChange={(opt: SingleValue<PositionOption>) => {
                              if (opt) setOverlayField(index, "textPosition", opt.value);
                            }}
                            styles={styles}
                            formatOptionLabel={formatOptionLabel}
                            isSearchable={false}
                            isDisabled={isGenerating}
                            instanceId={`position-${index}`}
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">
                            Text Effect
                          </span>
                          <Select<TextAnimOption, false>
                            options={TEXT_ANIM_OPTIONS}
                            value={
                              TEXT_ANIM_OPTIONS.find((o) => o.value === (overlay.textAnimation ?? "none")) ?? null
                            }
                            onChange={(opt: SingleValue<TextAnimOption>) => {
                              if (opt) setOverlayField(index, "textAnimation", opt.value);
                            }}
                            styles={styles}
                            formatOptionLabel={formatOptionLabel}
                            isSearchable={false}
                            isDisabled={isGenerating}
                            instanceId={`text-anim-${index}`}
                            menuPortalTarget={portalTarget}
                            menuPosition="fixed"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Duration per Image ────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
          Seconds per Image
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => { if (!isGenerating) onDurationChange(sec); }}
              disabled={isGenerating}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${isGenerating
                  ? "border-white/5 bg-white/3 text-white/20 cursor-not-allowed"
                  : durationPerImage === sec
                    ? "border-violet-500 bg-violet-600/30 text-white cursor-pointer"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:bg-white/10 cursor-pointer"
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
