"use client";

import { useSpring, animated, config } from "@react-spring/web";
import { useState, useCallback, type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useMicroInteractions } from "@/hooks/use-micro-interactions";

interface PressableProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  /** Intensity of the press animation */
  pressDepth?: "subtle" | "normal" | "deep";
  /** Play a sound on press */
  sound?: "click" | "pop" | "coin" | "none";
  /** Show a ripple effect */
  ripple?: boolean;
  /** Haptic feedback on press */
  haptic?: boolean;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Custom scale values [pressed, hover] */
  scale?: [number, number];
}

/**
 * A button with Duolingo-style spring animation feedback
 */
export function Pressable({
  children,
  onClick,
  pressDepth = "normal",
  sound = "click",
  ripple = false,
  haptic = true,
  loading = false,
  scale,
  className,
  disabled,
  ...props
}: PressableProps) {
  const [isPressed, setIsPressed] = useState(false);
  const { playSound, triggerHaptic } = useMicroInteractions();

  // Calculate scale based on press depth
  const scaleValues = scale || {
    subtle: [0.98, 1.01],
    normal: [0.95, 1.02],
    deep: [0.9, 1.03],
  }[pressDepth];

  const [springProps, api] = useSpring(() => ({
    scale: 1,
    y: 0,
    config: { tension: 400, friction: 22 },
  }));

  const handlePointerDown = useCallback(() => {
    if (disabled || loading) return;
    setIsPressed(true);
    api.start({ scale: scaleValues[0], y: pressDepth === "deep" ? 2 : 0 });
    if (sound !== "none") {
      playSound(sound);
    }
    if (haptic) {
      triggerHaptic("light");
    }
  }, [api, scaleValues, pressDepth, sound, haptic, disabled, loading, playSound, triggerHaptic]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    api.start({ scale: 1, y: 0, config: config.wobbly });
  }, [api]);

  const handlePointerEnter = useCallback(() => {
    if (disabled || loading) return;
    api.start({ scale: scaleValues[1] });
  }, [api, scaleValues, disabled, loading]);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
    api.start({ scale: 1, y: 0 });
  }, [api]);

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    await onClick?.(e);
  }, [onClick, disabled, loading]);

  return (
    <animated.button
      {...props}
      disabled={disabled || loading}
      style={{
        transform: springProps.scale.to((s) => `scale(${s})`),
        translateY: springProps.y,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      className={cn(
        "transition-shadow duration-150",
        isPressed && "shadow-sm",
        !isPressed && "shadow-md",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </animated.button>
  );
}

interface PressableDivProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Intensity of the press animation */
  pressDepth?: "subtle" | "normal" | "deep";
  /** Play a sound on press */
  sound?: "click" | "pop" | "coin" | "none";
  /** Haptic feedback on press */
  haptic?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * A div with press animation (for non-button elements)
 */
export function PressableDiv({
  children,
  pressDepth = "subtle",
  sound = "none",
  haptic = false,
  disabled = false,
  className,
  onClick,
  ...props
}: PressableDivProps) {
  const { playSound, triggerHaptic } = useMicroInteractions();

  const scaleValues = {
    subtle: [0.98, 1.01],
    normal: [0.95, 1.02],
    deep: [0.9, 1.03],
  }[pressDepth];

  const [springProps, api] = useSpring(() => ({
    scale: 1,
    config: { tension: 400, friction: 22 },
  }));

  const handlePointerDown = useCallback(() => {
    if (disabled) return;
    api.start({ scale: scaleValues[0] });
    if (sound !== "none") {
      playSound(sound);
    }
    if (haptic) {
      triggerHaptic("light");
    }
  }, [api, scaleValues, sound, haptic, disabled, playSound, triggerHaptic]);

  const handlePointerUp = useCallback(() => {
    api.start({ scale: 1, config: config.wobbly });
  }, [api]);

  const handlePointerLeave = useCallback(() => {
    api.start({ scale: 1 });
  }, [api]);

  return (
    <animated.div
      {...props}
      style={{
        transform: springProps.scale.to((s) => `scale(${s})`),
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={disabled ? undefined : onClick}
      className={cn(
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </animated.div>
  );
}
