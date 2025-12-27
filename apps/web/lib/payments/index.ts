/**
 * Payment Module - Public Exports
 *
 * This module provides payment provider abstraction for subscriptions and credits.
 */

// Types
export type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutSession,
  PortalSession,
  PaymentEvent,
  OneTimePaymentEvent,
  ProviderSubscription,
  PaymentEventType,
} from "./types";

// Configuration
export {
  PAYMENT_PROVIDER,
  PADDLE_CONFIG,
  LEMONSQUEEZY_CONFIG,
  SUBSCRIPTION_TIERS,
  CREDIT_PACKS,
  AI_FEATURE_COSTS,
  FEATURE_GATES,
  getCreditPack,
  getAIFeatureCost,
} from "./config";

export type {
  TierConfig,
  CreditPack,
  CreditPackId,
  AIFeatureConfig,
  FeatureGateConfig,
  GatedFeature,
} from "./config";

// Provider factory
export { getPaymentProvider, resetPaymentProvider } from "./provider";
