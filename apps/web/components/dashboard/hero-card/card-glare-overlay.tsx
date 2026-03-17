"use client";

import { animated, SpringValue, to } from "@react-spring/web";

interface CardGlareOverlayProps {
  glareX: SpringValue<number>;
  glareY: SpringValue<number>;
  style?: "standard" | "holographic" | "prismatic";
}

export function CardGlareOverlay({ glareX, glareY, style = "standard" }: CardGlareOverlayProps) {
  if (style === "prismatic") {
    return (
      <>
        {/* Layer 1: Full conic-gradient rainbow with color-dodge */}
        <animated.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: to(
              [glareX, glareY],
              (x, y) =>
                `conic-gradient(from 0deg at ${x * 100}% ${y * 100}%, hsl(0,90%,70%) 0deg, hsl(60,90%,70%) 60deg, hsl(120,90%,70%) 120deg, hsl(180,90%,70%) 180deg, hsl(240,90%,70%) 240deg, hsl(300,90%,70%) 300deg, hsl(360,90%,70%) 360deg)`
            ),
            mixBlendMode: "color-dodge" as const,
            opacity: 0.12,
          }}
        />
        {/* Layer 2: Radial spotlight with tilt-angle-derived hue shift */}
        <animated.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: to(
              [glareX, glareY],
              (x, y) => {
                const angle = Math.atan2(y - 0.5, x - 0.5);
                const hue = ((angle * 180) / Math.PI + 360) % 360;
                return `radial-gradient(circle at ${x * 100}% ${y * 100}%, hsla(${hue},85%,70%,0.3) 0%, hsla(${(hue + 90) % 360},75%,65%,0.12) 40%, transparent 70%)`;
              }
            ),
            mixBlendMode: "overlay" as const,
          }}
        />
      </>
    );
  }

  if (style === "holographic") {
    return (
      <animated.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: to(
            [glareX, glareY],
            (x, y) => {
              const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI);
              const hue1 = ((angle + 180) % 360);
              const hue2 = ((angle + 240) % 360);
              const hue3 = ((angle + 300) % 360);
              return `radial-gradient(circle at ${x * 100}% ${y * 100}%, hsla(${hue1},80%,75%,0.2) 0%, hsla(${hue2},80%,70%,0.1) 40%, hsla(${hue3},80%,65%,0.05) 70%, transparent 100%)`;
            }
          ),
          mixBlendMode: "overlay" as const,
        }}
      />
    );
  }

  return (
    <animated.div
      className="absolute inset-0 rounded-3xl pointer-events-none"
      style={{
        background: to(
          [glareX, glareY],
          (x, y) =>
            `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)`
        ),
      }}
    />
  );
}
