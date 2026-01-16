"use client";

import { usePostHog as usePostHogOriginal } from "posthog-js/react";
import { useCallback } from "react";

/**
 * Custom PostHog hook with type-safe event tracking
 *
 * @example
 * ```tsx
 * function ExpenseForm() {
 *   const { trackEvent } = usePostHog();
 *
 *   const handleSubmit = () => {
 *     trackEvent("expense_created", { amount: 100 });
 *   };
 * }
 * ```
 */
export function usePostHog() {
  const posthog = usePostHogOriginal();

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      posthog?.capture(eventName, properties);
    },
    [posthog]
  );

  const identifyUser = useCallback(
    (userId: string, properties?: Record<string, any>) => {
      posthog?.identify(userId, properties);
    },
    [posthog]
  );

  const setUserProperties = useCallback(
    (properties: Record<string, any>) => {
      posthog?.setPersonProperties(properties);
    },
    [posthog]
  );

  const resetUser = useCallback(() => {
    posthog?.reset();
  }, [posthog]);

  const isFeatureEnabled = useCallback(
    (flagKey: string): boolean => {
      return posthog?.isFeatureEnabled(flagKey) ?? false;
    },
    [posthog]
  );

  const getFeatureFlag = useCallback(
    (flagKey: string): boolean | string | undefined => {
      return posthog?.getFeatureFlag(flagKey);
    },
    [posthog]
  );

  return {
    posthog,
    trackEvent,
    identifyUser,
    setUserProperties,
    resetUser,
    isFeatureEnabled,
    getFeatureFlag,
  };
}
