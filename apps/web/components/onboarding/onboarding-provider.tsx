"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  useEffect,
  type ReactNode,
} from "react";
import type { UserOnboarding } from "@repo/database";
import {
  advanceOnboardingStep,
  completeOnboarding,
  skipOnboarding,
  resetOnboarding,
  dismissProgressiveHint,
  trackFeatureDiscovery,
  incrementExpenseCount,
} from "@/actions/onboarding";
import { useOnboardingEffects } from "@/hooks/use-onboarding-effects";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding/steps";
import { STORAGE_KEYS } from "@/lib/onboarding/constants";

interface OnboardingContextValue {
  // State
  isActive: boolean;
  currentStep: number;
  hasCompleted: boolean;
  isPending: boolean;
  totalSteps: number;

  // Tour actions
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  restartTour: () => void;

  // Progressive hints
  dismissHint: (hintId: string) => void;
  isHintDismissed: (hintId: string) => boolean;

  // Feature tracking
  trackFeature: (featureId: string) => void;
  onExpenseAdded: () => void;

  // Effects
  playSound: (type: "pop" | "whoosh" | "success" | "click") => void;
  fireConfetti: () => void;

  // Current step data
  currentStepData: (typeof ONBOARDING_STEPS)[number] | null;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

interface OnboardingProviderProps {
  children: ReactNode;
  initialState: UserOnboarding | null;
}

export function OnboardingProvider({
  children,
  initialState,
}: OnboardingProviderProps) {
  const [isPending, startTransition] = useTransition();
  const { playSound, fireConfetti } = useOnboardingEffects();

  // Local state for immediate UI updates
  const [isActive, setIsActive] = useState(() => {
    if (!initialState) return false;
    return !initialState.has_completed_tour && initialState.current_step === 0;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    return initialState?.current_step ?? 0;
  });

  const [hasCompleted, setHasCompleted] = useState(() => {
    return initialState?.has_completed_tour ?? false;
  });

  const [dismissedHints, setDismissedHints] = useState<Set<string>>(() => {
    const hints = initialState?.progressive_hints_shown ?? {};
    return new Set(
      Object.entries(hints)
        .filter(([, state]) => state.dismissed)
        .map(([id]) => id)
    );
  });

  // Sync local storage for immediate state on refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.tourStep, String(currentStep));
      localStorage.setItem(STORAGE_KEYS.tourCompleted, String(hasCompleted));
    }
  }, [currentStep, hasCompleted]);

  // Auto-start tour for new users
  useEffect(() => {
    if (initialState && !initialState.has_completed_tour && initialState.current_step === 0) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setIsActive(true);
        playSound("whoosh");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialState, playSound]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
    playSound("whoosh");
  }, [playSound]);

  const nextStep = useCallback(() => {
    const nextStepIndex = currentStep + 1;

    if (nextStepIndex >= TOTAL_STEPS) {
      // Tour complete!
      setHasCompleted(true);
      setIsActive(false);
      playSound("success");
      fireConfetti();

      startTransition(async () => {
        await completeOnboarding();
      });
    } else {
      setCurrentStep(nextStepIndex);
      playSound("pop");

      // Check if this step should trigger confetti
      const stepData = ONBOARDING_STEPS[nextStepIndex];
      if (stepData?.celebration) {
        setTimeout(() => fireConfetti(), 300);
      }

      startTransition(async () => {
        await advanceOnboardingStep();
      });
    }
  }, [currentStep, playSound, fireConfetti]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      playSound("click");
    }
  }, [currentStep, playSound]);

  const skipTour = useCallback(() => {
    setHasCompleted(true);
    setIsActive(false);
    playSound("click");

    startTransition(async () => {
      await skipOnboarding();
    });
  }, [playSound]);

  const completeTour = useCallback(() => {
    setHasCompleted(true);
    setIsActive(false);
    playSound("success");
    fireConfetti();

    startTransition(async () => {
      await completeOnboarding();
    });
  }, [playSound, fireConfetti]);

  const restartTour = useCallback(() => {
    setHasCompleted(false);
    setCurrentStep(0);
    setIsActive(true);
    playSound("whoosh");

    startTransition(async () => {
      await resetOnboarding();
    });
  }, [playSound]);

  const dismissHint = useCallback(
    (hintId: string) => {
      setDismissedHints((prev) => new Set(prev).add(hintId));
      playSound("click");

      startTransition(async () => {
        await dismissProgressiveHint(hintId);
      });
    },
    [playSound]
  );

  const isHintDismissed = useCallback(
    (hintId: string) => {
      return dismissedHints.has(hintId);
    },
    [dismissedHints]
  );

  const trackFeature = useCallback((featureId: string) => {
    startTransition(async () => {
      await trackFeatureDiscovery(featureId);
    });
  }, []);

  const onExpenseAdded = useCallback(() => {
    startTransition(async () => {
      await incrementExpenseCount();
    });
  }, []);

  const currentStepData = isActive ? ONBOARDING_STEPS[currentStep] ?? null : null;

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        hasCompleted,
        isPending,
        totalSteps: TOTAL_STEPS,
        startTour,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        restartTour,
        dismissHint,
        isHintDismissed,
        trackFeature,
        onExpenseAdded,
        playSound,
        fireConfetti,
        currentStepData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
