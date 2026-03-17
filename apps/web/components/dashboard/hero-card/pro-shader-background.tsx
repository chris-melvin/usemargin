"use client";

import { lazy, Suspense } from "react";
import type { BackgroundStyle } from "./card-theme";

const NeuroNoise = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.NeuroNoise }))
);
const Metaballs = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Metaballs }))
);
const GodRays = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.GodRays }))
);
const Swirl = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Swirl }))
);
const Waves = lazy(() =>
  import("@paper-design/shaders-react").then((m) => ({ default: m.Waves }))
);

interface ProShaderBackgroundProps {
  bgStyle: BackgroundStyle;
  colors: string[];
  cssGradient: string;
  speed: number;
}

export function ProShaderBackground({
  bgStyle,
  colors,
  cssGradient,
  speed,
}: ProShaderBackgroundProps) {
  const fallback = <div className="w-full h-full" style={{ background: cssGradient }} />;
  const c0 = colors[0] ?? "#000000";
  const c1 = colors[1] ?? c0;
  const c2 = colors[2] ?? c0;
  const c3 = colors[3] ?? c0;

  switch (bgStyle) {
    case "neuro":
      return (
        <Suspense fallback={fallback}>
          <NeuroNoise
            colorFront={c3}
            colorMid={c1}
            colorBack={c0}
            speed={speed}
            width="100%"
            height="100%"
          />
        </Suspense>
      );
    case "metaballs":
      return (
        <Suspense fallback={fallback}>
          <Metaballs
            colorBack={c0}
            colors={[c1, c2, c3]}
            count={8}
            size={0.55}
            speed={speed}
            width="100%"
            height="100%"
          />
        </Suspense>
      );
    case "godrays":
      return (
        <Suspense fallback={fallback}>
          <GodRays
            colorBack={c0}
            colors={[c1, c2, c3]}
            bloom={0.3}
            speed={speed}
            width="100%"
            height="100%"
          />
        </Suspense>
      );
    case "swirl":
      return (
        <Suspense fallback={fallback}>
          <Swirl
            colorBack={c0}
            colors={[c1, c2, c3]}
            bandCount={5}
            twist={0.6}
            speed={speed}
            width="100%"
            height="100%"
          />
        </Suspense>
      );
    case "waves":
      return (
        <Suspense fallback={fallback}>
          <Waves
            colorFront={c3}
            colorBack={c0}
            shape={1}
            frequency={0.5}
            width="100%"
            height="100%"
          />
        </Suspense>
      );
    default:
      return fallback;
  }
}
