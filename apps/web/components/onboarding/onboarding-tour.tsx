"use client";

import { useEffect } from "react";
import { useOnboarding } from "./onboarding-provider";
import { OnboardingSpotlight } from "./onboarding-spotlight";
import { OnboardingTooltip } from "./onboarding-tooltip";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";

export function OnboardingTour() {
  const {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    previousStep,
    skipTour,
    playSound,
  } = useOnboarding();

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          skipTour();
          break;
        case "ArrowRight":
        case "Enter":
          nextStep();
          break;
        case "ArrowLeft":
          previousStep();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, nextStep, previousStep, skipTour]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const target = document.querySelector(
      `[data-onboarding-target="${currentStepData.target}"]`
    );

    if (target) {
      // Calculate if element is visible
      const rect = target.getBoundingClientRect();
      const isVisible =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isVisible) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }
  }, [isActive, currentStep, currentStepData]);

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Spotlight overlay */}
      {currentStepData.highlight && (
        <OnboardingSpotlight
          targetSelector={currentStepData.target}
          isVisible={isActive}
          onClick={() => playSound("click")}
        />
      )}

      {/* Tooltip */}
      <OnboardingTooltip
        step={currentStepData}
        stepNumber={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
        isVisible={isActive}
      />
    </>
  );
}
