export type Effect =
  | "fade"
  | "zoom-in"
  | "zoom-out"
  | "ken-burns"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-pop"
  | "blur-to-focus"
  | "focus-to-blur"
  | "rotate-in"
  | "flip-3d"
  | "parallax"
  | "pan-left"
  | "pan-right"
  | "cross-dissolve"
  | "wipe"
  | "flash"
  | "glitch";

export type BackgroundStyle = "blur" | "solid" | "gradient";

export type TextPosition =
  | "top-left"    | "top-center"    | "top-right"
  | "center"
  | "bottom-left" | "bottom-center" | "bottom-right";

export const VALID_TEXT_POSITIONS: TextPosition[] = [
  "top-left", "top-center", "top-right",
  "center",
  "bottom-left", "bottom-center", "bottom-right",
];

export const TITLE_MAX_CHARS = 60;
export const SUBTITLE_MAX_CHARS = 120;

export type TextAnimation =
  | "none"
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale-pop"
  | "blur-to-focus"
  | "zoom-in";

/** Per-image text overlay configuration */
export interface TextOverlayConfig {
  title?: string;
  subtitle?: string;
  textPosition?: TextPosition;
  textAnimation?: TextAnimation;
}

/** Audio track + crop configuration */
export interface AudioConfig {
  file: File;
  audioDataUri: string;
  duration: number;    // total audio file duration in seconds
  cropStart: number;   // crop window start (seconds)
  cropEnd: number;     // crop window end (seconds)
}

export interface VideoFormData {
  images: File[];
  /** Per-image text overlays — one entry per image */
  overlays?: TextOverlayConfig[];
  /** Per-image effects — one entry per image (length must match images.length) */
  effects: Effect[];
  durationPerImage: number;
  backgroundStyle: BackgroundStyle;
  /** Optional audio track with crop settings */
  audioConfig?: AudioConfig | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIN_IMAGES = 1;
const MAX_IMAGES = 10;
const MIN_DURATION = 1;
const MAX_DURATION = 10;

export const VALID_EFFECTS: Effect[] = [
  "fade", "zoom-in", "zoom-out", "ken-burns",
  "slide-up", "slide-down", "slide-left", "slide-right",
  "scale-pop", "blur-to-focus", "focus-to-blur", "rotate-in",
  "flip-3d", "parallax", "pan-left", "pan-right",
  "cross-dissolve", "wipe", "flash", "glitch",
];

const VALID_BACKGROUNDS: BackgroundStyle[] = ["blur", "solid", "gradient"];

export function validateVideoFormData(data: VideoFormData): ValidationResult {
  if (!data.images || data.images.length === 0) {
    return { valid: false, error: "Please upload at least one image." };
  }

  if (data.images.length < MIN_IMAGES || data.images.length > MAX_IMAGES) {
    return {
      valid: false,
      error: `Please upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.`,
    };
  }

  for (const file of data.images) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `"${file.name}" is not a supported image format. Use JPEG, PNG, WebP, or GIF.`,
      };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `"${file.name}" exceeds the 10 MB file size limit.`,
      };
    }
  }

  if (!data.effects || data.effects.length === 0) {
    return { valid: false, error: "Please select at least one effect." };
  }

  if (data.effects.length !== data.images.length) {
    return {
      valid: false,
      error: "Number of effects must match number of images.",
    };
  }

  for (const e of data.effects) {
    if (!VALID_EFFECTS.includes(e)) {
      return { valid: false, error: `"${e}" is not a valid effect.` };
    }
  }

  if (!VALID_BACKGROUNDS.includes(data.backgroundStyle)) {
    return { valid: false, error: "Invalid background style selected." };
  }

  if (
    typeof data.durationPerImage !== "number" ||
    data.durationPerImage < MIN_DURATION ||
    data.durationPerImage > MAX_DURATION
  ) {
    return {
      valid: false,
      error: `Duration per image must be between ${MIN_DURATION} and ${MAX_DURATION} seconds.`,
    };
  }

  const totalSeconds = data.images.length * data.durationPerImage;
  if (totalSeconds <= 5) {
    return {
      valid: false,
      error: "Total video must be longer than 5 seconds. Add more images or increase duration per image.",
    };
  }

  if (data.audioConfig) {
    const { cropStart, cropEnd, duration } = data.audioConfig;

    if (cropStart < 0 || cropStart >= duration) {
      return { valid: false, error: "Audio crop start is out of range." };
    }
    if (cropEnd <= cropStart || cropEnd > duration) {
      return { valid: false, error: "Audio crop end is out of range." };
    }

    const clipDuration = cropEnd - cropStart;
    if (clipDuration < totalSeconds - 0.05) {
      return {
        valid: false,
        error: `Audio clip (${Math.round(clipDuration)}s) is shorter than the video (${Math.round(totalSeconds)}s). Expand the crop selection.`,
      };
    }
  }

  return { valid: true };
}
