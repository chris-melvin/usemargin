"use client";

import { useSpring, animated, config } from "@react-spring/web";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Z_LAYERS, SUCCESS_ANIMATION } from "@/lib/motion/config";

interface SuccessFlashProps {
  /** Whether to show the success animation */
  show: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Message to display */
  message?: string;
  /** Position of the flash */
  position?: "center" | "top" | "bottom";
  /** Size variant */
  size?: "small" | "medium" | "large";
}

/**
 * A satisfying success flash animation for completed actions
 */
export function SuccessFlash({
  show,
  onComplete,
  message = "Added!",
  position = "center",
  size = "medium",
}: SuccessFlashProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Backdrop flash
  const backdropSpring = useSpring({
    opacity: show ? 1 : 0,
    config: { tension: 300, friction: 20 },
  });

  // Checkmark circle scale and opacity
  const circleSpring = useSpring({
    scale: show ? 1 : 0,
    opacity: show ? 1 : 0,
    config: config.wobbly,
  });

  // Checkmark draw animation
  const checkSpring = useSpring({
    strokeDashoffset: show ? 0 : 50,
    config: { tension: 200, friction: 20 },
    delay: 150,
  });

  // Message fade in
  const messageSpring = useSpring({
    opacity: show ? 1 : 0,
    y: show ? 0 : 10,
    config: { tension: 200, friction: 20 },
    delay: 250,
  });

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, SUCCESS_ANIMATION.displayDuration);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !isVisible) return null;

  const sizeClasses = {
    small: { circle: "w-12 h-12", icon: "w-6 h-6", text: "text-sm" },
    medium: { circle: "w-16 h-16", icon: "w-8 h-8", text: "text-base" },
    large: { circle: "w-20 h-20", icon: "w-10 h-10", text: "text-lg" },
  }[size];

  const positionClasses = {
    center: "inset-0 items-center justify-center",
    top: "inset-x-0 top-20 items-start justify-center",
    bottom: "inset-x-0 bottom-32 items-end justify-center",
  }[position];

  return (
    <animated.div
      style={{
        opacity: backdropSpring.opacity,
        zIndex: Z_LAYERS.success,
      }}
      className={cn("fixed flex pointer-events-none", positionClasses)}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Success circle with checkmark */}
        <animated.div
          style={{
            transform: circleSpring.scale.to((s) => `scale(${s})`),
            opacity: circleSpring.opacity,
          }}
          className={cn(
            "rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600",
            "shadow-lg shadow-emerald-500/30",
            "flex items-center justify-center",
            sizeClasses.circle
          )}
        >
          <svg
            className={sizeClasses.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animated.path
              d="M5 12l5 5L19 7"
              strokeDasharray={50}
              style={{
                strokeDashoffset: checkSpring.strokeDashoffset,
              }}
            />
          </svg>
        </animated.div>

        {/* Message */}
        <animated.p
          style={{
            opacity: messageSpring.opacity,
            transform: messageSpring.y.to((y) => `translateY(${y}px)`),
          }}
          className={cn(
            "font-semibold text-stone-700",
            "bg-white/90 backdrop-blur-sm",
            "px-4 py-2 rounded-full",
            "shadow-lg",
            sizeClasses.text
          )}
        >
          {message}
        </animated.p>
      </div>
    </animated.div>
  );
}

interface MiniSuccessProps {
  /** Whether to show */
  show: boolean;
  /** X position (0-1 of viewport) */
  x?: number;
  /** Y position (0-1 of viewport) */
  y?: number;
}

/**
 * A tiny success indicator that appears at a specific point
 */
export function MiniSuccess({ show, x = 0.5, y = 0.5 }: MiniSuccessProps) {
  const spring = useSpring({
    scale: show ? 1 : 0,
    opacity: show ? 1 : 0,
    y: show ? -20 : 0,
    config: config.wobbly,
  });

  if (!show) return null;

  return (
    <animated.div
      style={{
        position: "fixed",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: spring.scale.to(
          (s) => `translate(-50%, -50%) scale(${s})`
        ),
        opacity: spring.opacity,
        translateY: spring.y,
        zIndex: Z_LAYERS.success,
        pointerEvents: "none",
      }}
    >
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
        <Check className="w-5 h-5 text-white" />
      </div>
    </animated.div>
  );
}
