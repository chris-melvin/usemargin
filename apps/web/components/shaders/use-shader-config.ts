"use client";

import { useState, useEffect } from "react";

interface ShaderConfig {
  /** Whether to use animated WebGL shaders or static CSS fallbacks */
  enabled: boolean;
  /** Reduced speed for mobile devices */
  speed: number;
}

/**
 * Hook that detects prefers-reduced-motion and mobile viewport
 * to provide appropriate shader config or CSS gradient fallbacks.
 */
export function useShaderConfig(): ShaderConfig {
  const [config, setConfig] = useState<ShaderConfig>({
    enabled: false, // SSR-safe default
    speed: 0.2,
  });

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 640;

    setConfig({
      enabled: !prefersReduced,
      speed: isMobile ? 0.1 : 0.2,
    });

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setConfig((prev) => ({ ...prev, enabled: !e.matches }));
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return config;
}
