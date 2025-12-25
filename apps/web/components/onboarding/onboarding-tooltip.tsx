"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { animated, useSpring, useTransition } from "@react-spring/web";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOOLTIP_OFFSET,
  TOOLTIP_PADDING,
  ONBOARDING_Z_INDEX,
} from "@/lib/onboarding/constants";
import type { OnboardingStep, TooltipPosition } from "@/lib/onboarding/steps";

interface TooltipPlacement {
  top: number;
  left: number;
  actualPosition: TooltipPosition;
  arrowPosition: "top" | "bottom" | "left" | "right";
}

interface OnboardingTooltipProps {
  step: OnboardingStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isVisible: boolean;
}

function calculatePlacement(
  targetSelector: string,
  preferredPosition: TooltipPosition,
  mobilePosition?: TooltipPosition
): TooltipPlacement | null {
  const target = document.querySelector(
    `[data-onboarding-target="${targetSelector}"]`
  );
  if (!target) return null;

  const bounds = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const isMobile = viewportWidth < 768;

  const position = isMobile && mobilePosition ? mobilePosition : preferredPosition;

  // Estimated tooltip dimensions
  const tooltipWidth = Math.min(320, viewportWidth - TOOLTIP_PADDING * 2);
  const tooltipHeight = 180;

  let top = 0;
  let left = 0;
  let actualPosition = position;
  let arrowPosition: "top" | "bottom" | "left" | "right" = "top";

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  switch (position) {
    case "top":
      top = bounds.top - tooltipHeight - TOOLTIP_OFFSET;
      left = centerX - tooltipWidth / 2;
      arrowPosition = "bottom";
      break;
    case "bottom":
      top = bounds.bottom + TOOLTIP_OFFSET;
      left = centerX - tooltipWidth / 2;
      arrowPosition = "top";
      break;
    case "left":
      top = centerY - tooltipHeight / 2;
      left = bounds.left - tooltipWidth - TOOLTIP_OFFSET;
      arrowPosition = "right";
      break;
    case "right":
      top = centerY - tooltipHeight / 2;
      left = bounds.right + TOOLTIP_OFFSET;
      arrowPosition = "left";
      break;
    case "center":
      top = viewportHeight / 2 - tooltipHeight / 2;
      left = viewportWidth / 2 - tooltipWidth / 2;
      arrowPosition = "top";
      break;
  }

  // Viewport boundary checks
  if (left < TOOLTIP_PADDING) {
    left = TOOLTIP_PADDING;
  } else if (left + tooltipWidth > viewportWidth - TOOLTIP_PADDING) {
    left = viewportWidth - tooltipWidth - TOOLTIP_PADDING;
  }

  if (top < TOOLTIP_PADDING) {
    // Flip to bottom if too high
    if (position === "top") {
      top = bounds.bottom + TOOLTIP_OFFSET;
      arrowPosition = "top";
      actualPosition = "bottom";
    } else {
      top = TOOLTIP_PADDING;
    }
  } else if (top + tooltipHeight > viewportHeight - TOOLTIP_PADDING) {
    // Flip to top if too low
    if (position === "bottom") {
      top = bounds.top - tooltipHeight - TOOLTIP_OFFSET;
      arrowPosition = "bottom";
      actualPosition = "top";
    } else {
      top = viewportHeight - tooltipHeight - TOOLTIP_PADDING;
    }
  }

  return { top, left, actualPosition, arrowPosition };
}

export function OnboardingTooltip({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isVisible,
}: OnboardingTooltipProps) {
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);

  const updatePlacement = useCallback(() => {
    const newPlacement = calculatePlacement(
      step.target,
      step.position,
      step.mobilePosition
    );
    setPlacement(newPlacement);
  }, [step.target, step.position, step.mobilePosition]);

  useEffect(() => {
    if (!isVisible) return;

    // Initial placement
    updatePlacement();

    // Update on scroll and resize
    const handleUpdate = () => updatePlacement();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isVisible, updatePlacement]);

  // Spring animation for tooltip entrance
  const tooltipSpring = useSpring({
    opacity: isVisible && placement ? 1 : 0,
    scale: isVisible && placement ? 1 : 0.9,
    y: isVisible && placement ? 0 : 10,
    config: { tension: 300, friction: 25 },
  });

  // Progress bar animation
  const progressSpring = useSpring({
    width: `${((stepNumber + 1) / totalSteps) * 100}%`,
    config: { tension: 180, friction: 24 },
  });

  if (!isVisible || !placement) return null;

  const isFirstStep = stepNumber === 0;
  const isLastStep = stepNumber === totalSteps - 1;

  return (
    <animated.div
      style={{
        position: "fixed",
        top: placement.top,
        left: placement.left,
        zIndex: ONBOARDING_Z_INDEX.tooltip,
        opacity: tooltipSpring.opacity,
        transform: tooltipSpring.scale.to(
          (s) => `scale(${s}) translateY(${tooltipSpring.y.get()}px)`
        ),
      }}
      className={cn(
        "w-[320px] max-w-[calc(100vw-32px)]",
        "bg-white rounded-2xl shadow-2xl",
        "border border-stone-200/60"
      )}
    >
      {/* Arrow */}
      <div
        className={cn(
          "absolute w-3 h-3 bg-white border-stone-200/60 rotate-45",
          placement.arrowPosition === "top" && "-top-1.5 left-1/2 -translate-x-1/2 border-t border-l",
          placement.arrowPosition === "bottom" && "-bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r",
          placement.arrowPosition === "left" && "-left-1.5 top-1/2 -translate-y-1/2 border-t border-l",
          placement.arrowPosition === "right" && "-right-1.5 top-1/2 -translate-y-1/2 border-b border-r"
        )}
      />

      {/* Progress bar */}
      <div className="h-1 bg-stone-100 rounded-t-2xl overflow-hidden">
        <animated.div
          style={{ width: progressSpring.width }}
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {step.emoji && (
              <span className="text-2xl animate-bounce">{step.emoji}</span>
            )}
            <div>
              <h3 className="text-base font-semibold text-stone-800">
                {step.title}
              </h3>
              <p className="text-xs text-stone-400">
                Step {stepNumber + 1} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors",
              isFirstStep
                ? "text-stone-300 cursor-not-allowed"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={onNext}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all",
              "bg-gradient-to-r from-amber-500 to-amber-600",
              "text-white shadow-lg shadow-amber-500/25",
              "hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105",
              "active:scale-95"
            )}
          >
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Get Started!
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Skip link */}
      <div className="px-4 pb-3 pt-0 text-center">
        <button
          onClick={onSkip}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </animated.div>
  );
}
