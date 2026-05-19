import type { ComponentType } from "react";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import {
  ReelFromImages,
  type ReelFromImagesProps,
} from "@/remotion/compositions/ReelFromImages";
import type { Effect, BackgroundStyle, TextOverlayConfig } from "./validation";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export interface ClientRenderOptions {
  images: File[];
  overlays?: TextOverlayConfig[];
  effects: Effect[];
  durationPerImage: number;
  backgroundStyle: BackgroundStyle;
  onProgress?: (progress: number) => void;
  /** Optional audio — data URI + crop start in seconds */
  audioDataUri?: string;
  audioCropStart?: number;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export async function renderReelVideoClient(
  options: ClientRenderOptions
): Promise<{ blob: Blob; objectUrl: string }> {
  const {
    images,
    overlays,
    effects,
    durationPerImage,
    backgroundStyle,
    onProgress,
    audioDataUri,
    audioCropStart = 0,
  } = options;

  const imageDataUris = await Promise.all(images.map(fileToDataUri));
  const durationInFrames = Math.max(
    1,
    Math.ceil(images.length * durationPerImage * FPS)
  );

  const inputProps: ReelFromImagesProps = {
    images: imageDataUris,
    title: "",
    subtitle: "",
    overlays: overlays ?? [],
    effects,
    durationPerImage,
    backgroundStyle,
    durationInFrames,
    ...(audioDataUri ? { audioSrc: audioDataUri, audioCropStart } : {}),
  };

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      id: "ReelFromImages",
      component: ReelFromImages as unknown as ComponentType<
        Record<string, unknown>
      >,
      durationInFrames,
      fps: FPS,
      width: WIDTH,
      height: HEIGHT,
    },
    inputProps: inputProps as unknown as Record<string, unknown>,
    container: "mp4",
    videoCodec: "h264",
    onProgress: ({ progress }) => onProgress?.(progress),
  });

  const blob = await getBlob();
  const objectUrl = URL.createObjectURL(blob);

  return { blob, objectUrl };
}
