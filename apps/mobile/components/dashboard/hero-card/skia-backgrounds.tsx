import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { BackgroundStyle } from "@repo/shared/card-theme";

/**
 * Shader backgrounds for the hero card.
 *
 * When running with a dev build that includes @shopify/react-native-skia,
 * these will use SKSL runtime shaders for GPU-accelerated effects.
 *
 * In Expo Go or when Skia is unavailable, they fall back to LinearGradient.
 */

let SkiaCanvas: any = null;
let SkiaShader: any = null;
try {
  const Skia = require("@shopify/react-native-skia");
  SkiaCanvas = Skia.Canvas;
  SkiaShader = Skia.RuntimeShader;
} catch {
  // Skia not available — use fallback
}

interface ShaderBackgroundProps {
  style: BackgroundStyle;
  colors: string[];
}

/**
 * SKSL shader sources — ported from web GLSL.
 * Used when @shopify/react-native-skia is available.
 */
const GRAIN_SKSL = `
uniform float2 iResolution;
uniform float iTime;
uniform half4 color1;
uniform half4 color2;

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / iResolution;
  float noise = fract(sin(dot(uv, float2(12.9898, 78.233))) * 43758.5453 + iTime);
  half4 gradient = mix(color1, color2, uv.y);
  return gradient + half4(noise * 0.05);
}
`;

const MESH_SKSL = `
uniform float2 iResolution;
uniform float iTime;
uniform half4 color1;
uniform half4 color2;
uniform half4 color3;

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / iResolution;
  float d1 = distance(uv, float2(0.3 + sin(iTime * 0.3) * 0.1, 0.3));
  float d2 = distance(uv, float2(0.7 + cos(iTime * 0.4) * 0.1, 0.7));
  float blend = smoothstep(0.0, 1.0, d1 / (d1 + d2));
  return mix(mix(color1, color2, blend), color3, uv.y * 0.3);
}
`;

function FallbackGradient({ colors }: { colors: string[] }) {
  const gradientColors = colors.length >= 2
    ? [colors[0], colors[1], colors[2] ?? colors[1]] as [string, string, ...string[]]
    : ["#1A9E9E", "#0F6B6B"] as [string, string, ...string[]];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

/**
 * ShaderBackground renders a GPU shader background when Skia is available,
 * or falls back to a LinearGradient.
 *
 * Pro backgrounds (neuro, metaballs, godrays, swirl, waves) require Skia.
 * Without it, they gracefully fall back to the gradient.
 */
export const ShaderBackground = memo(function ShaderBackground({
  style,
  colors,
}: ShaderBackgroundProps) {
  // For static or when Skia isn't available, use gradient fallback
  if (style === "static" || !SkiaCanvas) {
    return <FallbackGradient colors={colors} />;
  }

  // Select SKSL source based on background style
  const skslSource = style === "grain" ? GRAIN_SKSL : MESH_SKSL;

  // Skia-powered shader (only when dev build includes @shopify/react-native-skia)
  try {
    return (
      <SkiaCanvas style={StyleSheet.absoluteFill}>
        <SkiaShader source={skslSource} />
      </SkiaCanvas>
    );
  } catch {
    return <FallbackGradient colors={colors} />;
  }
});
