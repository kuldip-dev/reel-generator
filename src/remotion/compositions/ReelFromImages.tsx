import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  useCurrentFrame,
  Img,
  interpolate,
  spring,
} from "remotion";
import type { Effect, BackgroundStyle, TextPosition, TextAnimation, TextOverlayConfig } from "../../lib/validation";

export interface ReelFromImagesProps {
  images: string[];
  title: string;
  subtitle: string;
  /** Per-image text overlays — one entry per image */
  overlays?: TextOverlayConfig[];
  /** One effect per image — must have the same length as `images` */
  effects: Effect[];
  durationPerImage: number;
  backgroundStyle: BackgroundStyle;
  durationInFrames: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — standard fade-in/out opacity curve
// ─────────────────────────────────────────────────────────────────────────────
function useFade(localFrame: number, totalFrames: number, fadeLen = 12) {
  const f = Math.min(fadeLen, Math.floor(totalFrames * 0.15));
  return interpolate(
    localFrame,
    [0, f, totalFrames - f, totalFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Background layer
// ─────────────────────────────────────────────────────────────────────────────
const BackgroundLayer: React.FC<{ src: string; style: BackgroundStyle }> = ({
  src,
  style,
}) => {
  if (style === "blur") {
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.4) saturate(1.4)",
            transform: "scale(1.15)",
          }}
        />
      </AbsoluteFill>
    );
  }
  if (style === "gradient") {
    return (
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
        }}
      />
    );
  }
  return <AbsoluteFill style={{ backgroundColor: "#111111" }} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core image element (reused by every effect)
// ─────────────────────────────────────────────────────────────────────────────
const CoreImage: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill
    style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

// ─────────────────────────────────────────────────────────────────────────────
// 20 effects — all inline, no external files needed
// ─────────────────────────────────────────────────────────────────────────────
const EffectLayer: React.FC<{
  src: string;
  effect: Effect;
  localFrame: number;
  totalFrames: number;
  imageIndex: number;
  fps: number;
}> = ({ src, effect, localFrame, totalFrames, imageIndex, fps }) => {
  const opacity = useFade(localFrame, totalFrames);
  const prog = interpolate(localFrame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const img = <CoreImage src={src} />;

  switch (effect) {
    /* ── 1. Fade ─────────────────────────────────────────────── */
    case "fade":
      return <div style={{ opacity, width: "100%", height: "100%" }}>{img}</div>;

    /* ── 2. Zoom In ──────────────────────────────────────────── */
    case "zoom-in": {
      const scale = interpolate(localFrame, [0, totalFrames], [1, 1.12], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 3. Zoom Out ─────────────────────────────────────────── */
    case "zoom-out": {
      const scale = interpolate(localFrame, [0, totalFrames], [1.12, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <div
          style={{
            opacity,
            transform: `scale(${scale})`,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 4. Ken Burns ────────────────────────────────────────── */
    case "ken-burns": {
      const dir = imageIndex % 2 === 0 ? 1 : -1;
      const px = dir * interpolate(prog, [0, 1], [0, 30]);
      const py = (imageIndex % 3 === 0 ? 1 : -1) * interpolate(prog, [0, 1], [0, 20]);
      const sc = interpolate(prog, [0, 1], [1.05, 1.18]);
      return (
        <div
          style={{
            opacity,
            transform: `scale(${sc}) translate(${px}px,${py}px)`,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 5. Slide Up ─────────────────────────────────────────── */
    case "slide-up": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 100, damping: 20 }, durationInFrames: 20 });
      const ty = interpolate(sp, [0, 1], [80, 0]);
      return (
        <div style={{ opacity, transform: `translateY(${ty}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 6. Slide Down ───────────────────────────────────────── */
    case "slide-down": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 100, damping: 20 }, durationInFrames: 20 });
      const ty = interpolate(sp, [0, 1], [-80, 0]);
      return (
        <div style={{ opacity, transform: `translateY(${ty}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 7. Slide Left (enters from right) ───────────────────── */
    case "slide-left": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 100, damping: 20 }, durationInFrames: 20 });
      const tx = interpolate(sp, [0, 1], [80, 0]);
      return (
        <div style={{ opacity, transform: `translateX(${tx}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 8. Slide Right (enters from left) ───────────────────── */
    case "slide-right": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 100, damping: 20 }, durationInFrames: 20 });
      const tx = interpolate(sp, [0, 1], [-80, 0]);
      return (
        <div style={{ opacity, transform: `translateX(${tx}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 9. Scale Pop / Bounce In ────────────────────────────── */
    case "scale-pop": {
      const sp = spring({
        frame: localFrame,
        fps,
        config: { stiffness: 200, damping: 12, mass: 0.8 },
        durationInFrames: 25,
      });
      const fadeOut = interpolate(localFrame, [totalFrames - 12, totalFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <div
          style={{
            opacity: Math.min(sp, 1) * fadeOut,
            transform: `scale(${sp})`,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 10. Blur to Focus ───────────────────────────────────── */
    case "blur-to-focus": {
      const blur = interpolate(localFrame, [0, Math.min(20, totalFrames * 0.4)], [24, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const fadeIn = interpolate(localFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const fadeOut = interpolate(localFrame, [totalFrames - 12, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div
          style={{
            opacity: fadeIn * fadeOut,
            filter: `blur(${blur}px)`,
            width: "100%",
            height: "100%",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 11. Focus to Blur ───────────────────────────────────── */
    case "focus-to-blur": {
      const blurStart = Math.floor(totalFrames * 0.6);
      const blur = interpolate(localFrame, [blurStart, totalFrames], [0, 20], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const fadeIn = interpolate(localFrame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const fadeOut = interpolate(localFrame, [totalFrames - 10, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div
          style={{
            opacity: fadeIn * fadeOut,
            filter: `blur(${blur}px)`,
            width: "100%",
            height: "100%",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 12. Rotate In ───────────────────────────────────────── */
    case "rotate-in": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 120, damping: 18 }, durationInFrames: 22 });
      const rot = interpolate(sp, [0, 1], [-12, 0]);
      return (
        <div
          style={{
            opacity,
            transform: `rotate(${rot}deg)`,
            width: "100%",
            height: "100%",
            transformOrigin: "center",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 13. 3D Flip ─────────────────────────────────────────── */
    case "flip-3d": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 140, damping: 22 }, durationInFrames: 20 });
      const ry = interpolate(sp, [0, 1], [90, 0]);
      const fadeOut = interpolate(localFrame, [totalFrames - 12, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div
          style={{
            opacity: Math.min(sp * 2, 1) * fadeOut,
            transform: `rotateY(${ry}deg)`,
            width: "100%",
            height: "100%",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 14. Parallax Movement ───────────────────────────────── */
    case "parallax": {
      const dir = imageIndex % 2 === 0 ? 1 : -1;
      const tx = dir * interpolate(prog, [0, 1], [-20, 20]);
      const ty = interpolate(prog, [0, 1], [-10, 10]);
      return (
        <div style={{ opacity, transform: `translate(${tx}px, ${ty}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 15. Pan Left to Right ───────────────────────────────── */
    case "pan-left": {
      const tx = interpolate(prog, [0, 1], [-40, 40]);
      return (
        <div style={{ opacity, transform: `translateX(${tx}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 16. Pan Right to Left ───────────────────────────────── */
    case "pan-right": {
      const tx = interpolate(prog, [0, 1], [40, -40]);
      return (
        <div style={{ opacity, transform: `translateX(${tx}px)`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 17. Cross Dissolve ──────────────────────────────────── */
    case "cross-dissolve": {
      // Slightly longer, softer fade — classic dissolve feel
      const f = Math.min(20, Math.floor(totalFrames * 0.25));
      const op = interpolate(
        localFrame,
        [0, f, totalFrames - f, totalFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const bright = interpolate(localFrame, [0, f], [1.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div style={{ opacity: op, filter: `brightness(${bright})`, width: "100%", height: "100%" }}>
          {img}
        </div>
      );
    }

    /* ── 18. Wipe (left → right reveal) ─────────────────────── */
    case "wipe": {
      const wipeIn = interpolate(localFrame, [0, Math.min(18, totalFrames * 0.3)], [0, 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const fadeOut = interpolate(localFrame, [totalFrames - 12, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div
          style={{
            opacity: fadeOut,
            clipPath: `inset(0 ${100 - wipeIn}% 0 0)`,
            width: "100%",
            height: "100%",
          }}
        >
          {img}
        </div>
      );
    }

    /* ── 19. Light Flash / Camera Flash ─────────────────────── */
    case "flash": {
      // Image fades in normally; a white overlay flashes brightly at frame 0
      const flashLen = Math.min(8, totalFrames * 0.15);
      const flashOp = interpolate(localFrame, [0, flashLen], [0.9, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const fadeOut = interpolate(localFrame, [totalFrames - 10, totalFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <div style={{ opacity: fadeOut, width: "100%", height: "100%" }}>{img}</div>
          {/* white flash overlay */}
          <AbsoluteFill
            style={{
              backgroundColor: "#ffffff",
              opacity: flashOp,
              pointerEvents: "none",
            }}
          />
        </div>
      );
    }

    /* ── 20. Glitch ──────────────────────────────────────────── */
    case "glitch": {
      // Oscillating horizontal jitter + hue-rotate + brief desaturation
      const jitter =
        Math.sin(localFrame * 2.1) * 6 +
        Math.sin(localFrame * 5.7) * 3;
      const hue = interpolate(localFrame, [0, totalFrames], [0, 30], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      // Only active for first 30% and last 20%
      const glitchActive =
        localFrame < totalFrames * 0.3 || localFrame > totalFrames * 0.8;
      const tx = glitchActive ? jitter : 0;
      const saturation = glitchActive ? 1.8 : 1;
      return (
        <div
          style={{
            opacity,
            transform: `translateX(${tx}px)`,
            filter: `hue-rotate(${hue}deg) saturate(${saturation})`,
            width: "100%",
            height: "100%",
          }}
        >
          {img}
        </div>
      );
    }

    default:
      return <div style={{ opacity, width: "100%", height: "100%" }}>{img}</div>;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Text animation — compute wrapper style from animation type
// ─────────────────────────────────────────────────────────────────────────────
function textAnimStyle(
  animation: TextAnimation,
  localFrame: number,
  totalFrames: number,
  fps: number
): React.CSSProperties {
  const fadeOut = interpolate(localFrame, [totalFrames - 10, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  switch (animation) {
    case "none":
      return {};

    case "fade": {
      const fadeIn = interpolate(localFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { opacity: Math.min(fadeIn, fadeOut) };
    }

    case "slide-up": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 120, damping: 18 }, durationInFrames: 20 });
      const ty = interpolate(sp, [0, 1], [60, 0]);
      const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { transform: `translateY(${ty}px)`, opacity: Math.min(fadeIn, fadeOut) };
    }

    case "slide-down": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 120, damping: 18 }, durationInFrames: 20 });
      const ty = interpolate(sp, [0, 1], [-60, 0]);
      const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { transform: `translateY(${ty}px)`, opacity: Math.min(fadeIn, fadeOut) };
    }

    case "slide-left": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 120, damping: 18 }, durationInFrames: 20 });
      const tx = interpolate(sp, [0, 1], [80, 0]);
      const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { transform: `translateX(${tx}px)`, opacity: Math.min(fadeIn, fadeOut) };
    }

    case "slide-right": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 120, damping: 18 }, durationInFrames: 20 });
      const tx = interpolate(sp, [0, 1], [-80, 0]);
      const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { transform: `translateX(${tx}px)`, opacity: Math.min(fadeIn, fadeOut) };
    }

    case "scale-pop": {
      const sp = spring({ frame: localFrame, fps, config: { stiffness: 200, damping: 14, mass: 0.8 }, durationInFrames: 22 });
      return { transform: `scale(${sp})`, opacity: Math.min(sp, 1) * fadeOut };
    }

    case "blur-to-focus": {
      const blur = interpolate(localFrame, [0, Math.min(18, Math.floor(totalFrames * 0.4))], [16, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const fadeIn = interpolate(localFrame, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { filter: `blur(${blur}px)`, opacity: Math.min(fadeIn, fadeOut) };
    }

    case "zoom-in": {
      const scale = interpolate(localFrame, [0, totalFrames], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const fadeIn = interpolate(localFrame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return { transform: `scale(${scale})`, transformOrigin: "center", opacity: Math.min(fadeIn, fadeOut) };
    }

    default:
      return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-image text overlay — supports 7 positions + 9 animations
// ─────────────────────────────────────────────────────────────────────────────
function positionStyles(pos: TextPosition): React.CSSProperties {
  const V: Record<string, string> = {
    top: "flex-start", center: "center", bottom: "flex-end",
  };
  const H: Record<string, string> = {
    left: "flex-start", center: "center", right: "flex-end",
  };
  const textAlignMap: Record<string, React.CSSProperties["textAlign"]> = {
    left: "left", center: "center", right: "right",
  };

  const [vKey, hKey] = pos === "center" ? ["center", "center"] : pos.split("-");
  const vAlign = V[vKey] ?? "flex-end";
  const hAlign = H[hKey] ?? "center";
  const textAlign = textAlignMap[hKey] ?? "center";

  const isTop = vKey === "top";
  const isBottom = vKey === "bottom";

  return {
    justifyContent: vAlign,
    alignItems: hAlign,
    paddingTop: isTop ? 100 : 0,
    paddingBottom: isBottom ? 100 : 0,
    paddingLeft: 60,
    paddingRight: 60,
    textAlign,
  };
}

const TextOverlay: React.FC<{ overlay: TextOverlayConfig; totalFrames: number }> = ({
  overlay,
  totalFrames,
}) => {
  // Hooks MUST be called unconditionally — before any early return
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { title, subtitle, textPosition = "bottom-center", textAnimation = "none" } = overlay;
  if (!title && !subtitle) return null;

  const { textAlign, alignItems, ...containerStyle } = positionStyles(textPosition) as React.CSSProperties & { alignItems: string };
  const animStyle = textAnimStyle(textAnimation, localFrame, totalFrames, fps);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        pointerEvents: "none",
        alignItems,
        ...containerStyle,
      }}
    >
      {/* Animation wrapper — wraps title + description together */}
      <div style={{ display: "flex", flexDirection: "column", alignItems, ...animStyle }}>
        {title && (
          <div
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 72,
              fontWeight: 800,
              color: "#ffffff",
              textAlign: textAlign as React.CSSProperties["textAlign"],
              textShadow: "0 4px 24px rgba(0,0,0,0.8)",
              lineHeight: 1.2,
              marginBottom: subtitle ? 24 : 0,
              maxWidth: "90%",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontFamily: "'Arial', sans-serif",
              fontSize: 44,
              fontWeight: 400,
              color: "rgba(255,255,255,0.85)",
              textAlign: textAlign as React.CSSProperties["textAlign"],
              textShadow: "0 2px 16px rgba(0,0,0,0.7)",
              lineHeight: 1.3,
              maxWidth: "85%",
              wordBreak: "break-word",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Per-Sequence slide wrapper (reads local frame inside Sequence context)
// ─────────────────────────────────────────────────────────────────────────────
const Slide: React.FC<{
  src: string;
  effect: Effect;
  totalFrames: number;
  imageIndex: number;
  backgroundStyle: BackgroundStyle;
  overlay: TextOverlayConfig;
}> = ({ src, effect, totalFrames, imageIndex, backgroundStyle, overlay }) => {
  const localFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BackgroundLayer src={src} style={backgroundStyle} />
      <EffectLayer
        src={src}
        effect={effect}
        localFrame={localFrame}
        totalFrames={totalFrames}
        imageIndex={imageIndex}
        fps={fps}
      />
      <TextOverlay overlay={overlay} totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main composition
// ─────────────────────────────────────────────────────────────────────────────
export const ReelFromImages: React.FC<ReelFromImagesProps> = ({
  images,
  overlays = [],
  effects,
  durationPerImage,
  backgroundStyle,
}) => {
  const { fps } = useVideoConfig();
  const framesPerImage = Math.ceil(durationPerImage * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {images.map((src, index) => (
        <Sequence
          key={index}
          from={index * framesPerImage}
          durationInFrames={framesPerImage}
        >
          <Slide
            src={src}
            effect={effects[index] ?? effects[0] ?? "fade"}
            totalFrames={framesPerImage}
            imageIndex={index}
            backgroundStyle={backgroundStyle}
            overlay={overlays[index] ?? {}}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
