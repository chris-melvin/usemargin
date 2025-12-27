/**
 * Payment Provider Abstraction Types
 *
 * Provider-agnostic interfaces for subscription management.
 * Implement these interfaces for Paddle, LemonSqueezy, or other providers.
 */

import type {
  BillingCycle,
  SubscriptionStatus,
  PaymentProvider as ProviderName,
} from "@repo/database";

// =============================================================================
// CHECKOUT TYPES
// =============================================================================

/**
 * Parameters for creating a checkout session
 */
export interface CreateCheckoutParams {
  userId: string;
  email: string;
  billingCycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Result of creating a checkout session
 */
export interface CheckoutSession {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Customer portal session result
 */
export interface PortalSession {
  portalUrl: string;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Webhook event types we handle
 */
export type PaymentEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.cancelled"
  | "subscription.payment_succeeded"
  | "subscription.payment_failed"
  | "one_time.completed"; // For credit pack purchases

/**
 * Normalized webhook event from any provider
 */
export interface PaymentEvent {
  type: PaymentEventType;
  eventId?: string; // Provider's unique event ID (for idempotency)
  occurredAt?: string; // When the event occurred (ISO string)
  providerSubscriptionId: string;
  providerCustomerId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  customData: Record<string, unknown>; // Contains userId from checkout
  rawPayload: unknown;
}

/**
 * Normalized one-time payment event (for credit packs)
 */
export interface OneTimePaymentEvent {
  type: "one_time.completed";
  eventId?: string; // Provider's unique event ID (for idempotency)
  occurredAt?: string; // When the event occurred (ISO string)
  providerTransactionId: string;
  providerCustomerId: string;
  productId: string; // Credit pack ID
  customData: Record<string, unknown>; // Contains userId, packId
  rawPayload: unknown;
}

// =============================================================================
// SUBSCRIPTION DATA TYPES
// =============================================================================

/**
 * Normalized subscription data from provider
 */
export interface ProviderSubscription {
  providerSubscriptionId: string;
  providerCustomerId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

/**
 * Payment provider interface - implement for each provider
 *
 * This abstraction allows swapping between Paddle, LemonSqueezy,
 * or other Merchant of Record providers without changing business logic.
 */
export interface PaymentProvider {
  /**
   * Provider name identifier
   */
  readonly name: ProviderName;

  /**
   * Create a checkout session for a new subscription
   * The userId should be passed in customData/passthrough for webhook handling
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>;

  /**
   * Create a checkout session for a one-time credit pack purchase
   */
  createCreditPackCheckout(params: {
    userId: string;
    email: string;
    packId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  /**
   * Get customer portal URL for managing subscription
   */
  getPortalUrl(providerCustomerId: string): Promise<PortalSession>;

  /**
   * Cancel a subscription (at period end by default)
   */
  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  /**
   * Resume a cancelled subscription (if still within period)
   */
  resumeSubscription(providerSubscriptionId: string): Promise<void>;

  /**
   * Parse and verify webhook payload
   * Returns null if signature verification fails
   */
  parseWebhook(
    payload: string,
    signature: string
  ): Promise<PaymentEvent | OneTimePaymentEvent | null>;

  /**
   * Get subscription details from provider API
   */
  getSubscription(
    providerSubscriptionId: string
  ): Promise<ProviderSubscription | null>;
}
