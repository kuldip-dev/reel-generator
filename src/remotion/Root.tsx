import React from "react";
import { Composition } from "remotion";
import type { ComponentType } from "react";
import { ReelFromImages, type ReelFromImagesProps } from "./compositions/ReelFromImages";

const defaultProps: ReelFromImagesProps = {
  images: [],
  title: "Your Title Here",
  subtitle: "Your subtitle goes here",
  effects: ["fade" as const],
  durationPerImage: 3,
  backgroundStyle: "blur",
  durationInFrames: 90,
};

/**
 * Remotion Root — registers all compositions.
 * The actual durationInFrames is supplied via inputProps at render time.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ReelFromImages"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={ReelFromImages as unknown as ComponentType<Record<string, unknown>>}
      durationInFrames={defaultProps.durationInFrames}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => {
        const p = props as unknown as ReelFromImagesProps;
        const fps = 30;
        const frames = Math.max(
          1,
          Math.ceil(p.images.length * p.durationPerImage * fps)
        );
        return { durationInFrames: frames };
      }}
    />
  );
};
