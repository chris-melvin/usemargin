import posthog from "posthog-js";

/**
 * Track a custom event with PostHog
 * Use this in client components to track user actions
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Identify a user in PostHog
 * Call this after user logs in
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset PostHog identity
 * Call this when user logs out
 */
export function resetUser() {
  if (typeof window !== "undefined" && posthog) {
    posthog.reset();
  }
}

/**
 * Set user properties
 * Use this to update user attributes
 */
export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== "undefined" && posthog) {
    posthog.setPersonProperties(properties);
  }
}

/**
 * Track feature flag evaluation
 * Use this to track when feature flags are checked
 */
export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  if (typeof window !== "undefined" && posthog) {
    return posthog.getFeatureFlag(flagKey);
  }
  return undefined;
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window !== "undefined" && posthog) {
    return posthog.isFeatureEnabled(flagKey) ?? false;
  }
  return false;
}

// Export the posthog client for advanced use cases
export { posthog };
