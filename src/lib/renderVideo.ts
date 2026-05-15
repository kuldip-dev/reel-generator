import fs from "fs";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { getRendersDir } from "./fileUtils";
import type { Effect, BackgroundStyle, TextOverlayConfig } from "./validation";

export interface RenderOptions {
  images: string[]; // absolute paths to uploaded images
  /** Per-image text overlays — one entry per image */
  overlays?: TextOverlayConfig[];
  /** Per-image effects — one entry per image */
  effects: Effect[];
  durationPerImage: number;
  backgroundStyle: BackgroundStyle;
  outputFileName: string;
}

// Cache the bundle URL across renders in the same process to avoid re-bundling
let cachedBundleUrl: string | null = null;

async function getBundleUrl(): Promise<string> {
  if (cachedBundleUrl) return cachedBundleUrl;

  const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");
  cachedBundleUrl = await bundle({
    entryPoint,
    onProgress: () => {},
  });

  return cachedBundleUrl;
}

/**
 * Convert an image file on disk to a base64 data URI.
 *
 * Remotion's internal Chromium browser loads resources from its own
 * bundled webpack server, so absolute filesystem paths cannot be fetched
 * as HTTP URLs.  Encoding images as data URIs sidesteps the problem
 * entirely — no network request is needed.
 */
function toDataUri(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : ext === "gif"
      ? "image/gif"
      : "image/jpeg";

  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
}

export async function renderReelVideo(options: RenderOptions): Promise<string> {
  const {
    images,
    overlays,
    effects,
    durationPerImage,
    backgroundStyle,
    outputFileName,
  } = options;

  const outputPath = path.join(getRendersDir(), outputFileName);
  const fps = 30;
  const durationInFrames = Math.ceil(images.length * durationPerImage * fps);

  // Convert every image path to a base64 data URI so Remotion's internal
  // browser can load them without making filesystem/HTTP requests.
  const imageDataUris = images.map(toDataUri);

  const inputProps = {
    images: imageDataUris,
    overlays: overlays ?? [],
    effects,
    durationPerImage,
    backgroundStyle,
    durationInFrames,
  };

  const serveUrl = await getBundleUrl();

  const composition = await selectComposition({
    serveUrl,
    id: "ReelFromImages",
    inputProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    onProgress: () => {},
  });

  return outputPath;
}
