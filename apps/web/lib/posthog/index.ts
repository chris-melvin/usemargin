// Main PostHog utilities
export {
  trackEvent,
  identifyUser,
  resetUser,
  setUserProperties,
  getFeatureFlag,
  isFeatureEnabled,
  posthog,
} from "../posthog";

// React hook
export { usePostHog } from "./use-posthog";

// Server-side client
export { getPostHogClient, shutdownPostHog } from "../posthog-server";
