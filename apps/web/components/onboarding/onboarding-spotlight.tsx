"use client";

import { useEffect, useState, useCallback } from "react";
import { animated, useSpring } from "@react-spring/web";
import {
  SPOTLIGHT_PADDING,
  SPOTLIGHT_BORDER_RADIUS,
  ONBOARDING_Z_INDEX,
} from "@/lib/onboarding/constants";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingSpotlightProps {
  targetSelector: string;
  isVisible: boolean;
  onClick?: () => void;
}

export function OnboardingSpotlight({
  targetSelector,
  isVisible,
  onClick,
}: OnboardingSpotlightProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const updateRect = useCallback(() => {
    const target = document.querySelector(
      `[data-onboarding-target="${targetSelector}"]`
    );
    if (target) {
      const bounds = target.getBoundingClientRect();
      setRect({
        top: bounds.top - SPOTLIGHT_PADDING,
        left: bounds.left - SPOTLIGHT_PADDING,
        width: bounds.width + SPOTLIGHT_PADDING * 2,
        height: bounds.height + SPOTLIGHT_PADDING * 2,
      });
    }
  }, [targetSelector]);

  useEffect(() => {
    if (!isVisible) return;

    updateRect();

    // Update on scroll and resize
    const handleUpdate = () => updateRect();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    // Also observe the target for layout changes
    const target = document.querySelector(
      `[data-onboarding-target="${targetSelector}"]`
    );
    let resizeObserver: ResizeObserver | null = null;

    if (target) {
      resizeObserver = new ResizeObserver(handleUpdate);
      resizeObserver.observe(target);
    }

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
      resizeObserver?.disconnect();
    };
  }, [targetSelector, isVisible, updateRect]);

  // Animation for the spotlight overlay
  const overlaySpring = useSpring({
    opacity: isVisible && rect ? 1 : 0,
    config: { tension: 280, friction: 30 },
  });

  // Animation for the cutout position
  const cutoutSpring = useSpring({
    top: rect?.top ?? 0,
    left: rect?.left ?? 0,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
    config: { tension: 200, friction: 25 },
  });

  if (!isVisible || !rect) return null;

  // Create clip path for the cutout effect
  const clipPath = `
    polygon(
      0% 0%,
      0% 100%,
      ${cutoutSpring.left.to((v) => v)}px 100%,
      ${cutoutSpring.left.to((v) => v)}px ${cutoutSpring.top.to((v) => v + (rect?.height ?? 0))}px,
      ${cutoutSpring.left.to((v) => v + (rect?.width ?? 0))}px ${cutoutSpring.top.to((v) => v + (rect?.height ?? 0))}px,
      ${cutoutSpring.left.to((v) => v + (rect?.width ?? 0))}px ${cutoutSpring.top.to((v) => v)}px,
      ${cutoutSpring.left.to((v) => v)}px ${cutoutSpring.top.to((v) => v)}px,
      ${cutoutSpring.left.to((v) => v)}px 100%,
      100% 100%,
      100% 0%
    )
  `;

  return (
    <>
      {/* Main overlay with cutout */}
      <animated.div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: ONBOARDING_Z_INDEX.spotlight,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          opacity: overlaySpring.opacity,
          pointerEvents: "auto",
        }}
        onClick={onClick}
        aria-hidden="true"
      />

      {/* Highlighted area border/glow */}
      <animated.div
        style={{
          position: "fixed",
          top: cutoutSpring.top,
          left: cutoutSpring.left,
          width: cutoutSpring.width,
          height: cutoutSpring.height,
          zIndex: ONBOARDING_Z_INDEX.spotlight + 1,
          borderRadius: SPOTLIGHT_BORDER_RADIUS,
          boxShadow: `
            0 0 0 4px rgba(245, 158, 11, 0.6),
            0 0 20px rgba(245, 158, 11, 0.4),
            0 0 40px rgba(245, 158, 11, 0.2)
          `,
          pointerEvents: "none",
          opacity: overlaySpring.opacity,
        }}
        className="animate-pulse"
      />

      {/* Transparent cutout area (allows clicks through) */}
      <animated.div
        style={{
          position: "fixed",
          top: cutoutSpring.top,
          left: cutoutSpring.left,
          width: cutoutSpring.width,
          height: cutoutSpring.height,
          zIndex: ONBOARDING_Z_INDEX.spotlight + 2,
          borderRadius: SPOTLIGHT_BORDER_RADIUS,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </>
  );
}
