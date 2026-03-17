"use client";

import { animated, SpringValue, to } from "@react-spring/web";
import type { CardMaterial } from "./card-theme";

interface CardMaterialOverlayProps {
  material: CardMaterial;
  glareX: SpringValue<number>;
  glareY: SpringValue<number>;
}

export function CardMaterialOverlay({ material, glareX, glareY }: CardMaterialOverlayProps) {
  if (material === "default") return null;

  if (material === "glass") {
    return (
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      />
    );
  }

  if (material === "metallic") {
    return (
      <animated.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: to(
            [glareX, glareY],
            (x, y) =>
              `conic-gradient(from 0deg at ${x * 100}% ${y * 100}%, rgba(212,212,216,0.4) 0deg, rgba(161,161,170,0.2) 90deg, rgba(228,228,231,0.5) 180deg, rgba(161,161,170,0.2) 270deg, rgba(212,212,216,0.4) 360deg)`
          ),
          mixBlendMode: "overlay" as const,
        }}
      />
    );
  }

  // Holo: Pokemon card rainbow refraction effect
  return (
    <>
      {/* Layer 1: Full rainbow conic gradient with color-dodge */}
      <animated.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: to(
            [glareX, glareY],
            (x, y) =>
              `conic-gradient(from 0deg at ${x * 100}% ${y * 100}%, hsl(0,90%,70%) 0deg, hsl(60,90%,70%) 60deg, hsl(120,90%,70%) 120deg, hsl(180,90%,70%) 180deg, hsl(240,90%,70%) 240deg, hsl(300,90%,70%) 300deg, hsl(360,90%,70%) 360deg)`
          ),
          mixBlendMode: "color-dodge" as const,
          opacity: 0.15,
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
              return `radial-gradient(circle at ${x * 100}% ${y * 100}%, hsla(${hue},80%,65%,0.35) 0%, hsla(${(hue + 60) % 360},70%,60%,0.15) 40%, transparent 70%)`;
            }
          ),
          mixBlendMode: "overlay" as const,
          opacity: 0.2,
        }}
      />
    </>
  );
}
