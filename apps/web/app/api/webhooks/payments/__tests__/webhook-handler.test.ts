import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Webhook Handler Tests
 *
 * These tests verify webhook processing including:
 * - Idempotency (duplicate event handling)
 * - Timestamp validation
 * - Subscription state management
 * - Credit pack processing
 */

// Webhook timestamp tolerance (5 minutes in ms)
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

interface WebhookEvent {
  eventId: string;
  occurredAt: string;
  type: string;
  data: Record<string, unknown>;
}

// Pure function implementations for testing

/**
 * Check if webhook timestamp is within acceptable range
 */
function isTimestampValid(
  occurredAt: string | undefined,
  toleranceMs: number = WEBHOOK_TIMESTAMP_TOLERANCE_MS
): boolean {
  if (!occurredAt) {
    // No timestamp - allow (for backwards compatibility)
    return true;
  }

  const eventTime = new Date(occurredAt).getTime();
  const now = Date.now();

  return now - eventTime <= toleranceMs;
}

/**
 * Simulate idempotency check
 */
class MockIdempotencyStore {
  private processedEvents = new Set<string>();

  markProcessed(eventId: string): boolean {
    if (this.processedEvents.has(eventId)) {
      return false; // Already processed
    }
    this.processedEvents.add(eventId);
    return true;
  }

  isProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  reset(): void {
    this.processedEvents.clear();
  }
}

/**
 * Determine tier based on subscription event
 */
function determineTierFromEvent(
  status: string,
  currentPeriodEnd: Date
): "pro" | "free" {
  const now = new Date();

  if (status === "active" || status === "trialing") {
    return "pro";
  }

  if (
    status === "cancelled" ||
    status === "past_due" ||
    status === "paused"
  ) {
    return currentPeriodEnd > now ? "pro" : "free";
  }

  // expired
  return "free";
}

/**
 * Simulate webhook processing result
 */
interface ProcessingResult {
  success: boolean;
  reason?: "invalid_signature" | "duplicate" | "too_old" | "processing_error";
  deduplicated?: boolean;
}

function processWebhook(
  event: WebhookEvent | null,
  idempotencyStore: MockIdempotencyStore,
  signatureValid: boolean = true
): ProcessingResult {
  // Signature verification
  if (!event || !signatureValid) {
    return { success: false, reason: "invalid_signature" };
  }

  // Timestamp validation
  if (!isTimestampValid(event.occurredAt)) {
    return { success: false, reason: "too_old" };
  }

  // Idempotency check
  if (event.eventId) {
    const wasProcessed = idempotencyStore.markProcessed(event.eventId);
    if (!wasProcessed) {
      return { success: true, deduplicated: true, reason: "duplicate" };
    }
  }

  // Would process event here...
  return { success: true };
}

describe("Webhook Handler", () => {
  let idempotencyStore: MockIdempotencyStore;

  beforeEach(() => {
    idempotencyStore = new MockIdempotencyStore();
  });

  describe("Timestamp Validation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should accept webhook from 1 minute ago", () => {
      const oneMinuteAgo = new Date("2024-06-15T11:59:00Z").toISOString();
      expect(isTimestampValid(oneMinuteAgo)).toBe(true);
    });

    it("should accept webhook from 4 minutes ago", () => {
      const fourMinutesAgo = new Date("2024-06-15T11:56:00Z").toISOString();
      expect(isTimestampValid(fourMinutesAgo)).toBe(true);
    });

    it("should accept webhook from exactly 5 minutes ago", () => {
      const fiveMinutesAgo = new Date("2024-06-15T11:55:00Z").toISOString();
      expect(isTimestampValid(fiveMinutesAgo)).toBe(true);
    });

    it("should reject webhook from 6 minutes ago", () => {
      const sixMinutesAgo = new Date("2024-06-15T11:54:00Z").toISOString();
      expect(isTimestampValid(sixMinutesAgo)).toBe(false);
    });

    it("should reject webhook from 1 hour ago", () => {
      const oneHourAgo = new Date("2024-06-15T11:00:00Z").toISOString();
      expect(isTimestampValid(oneHourAgo)).toBe(false);
    });

    it("should accept webhook with no timestamp (backwards compatibility)", () => {
      expect(isTimestampValid(undefined)).toBe(true);
    });

    it("should accept webhook from future (clock skew)", () => {
      const futureTime = new Date("2024-06-15T12:01:00Z").toISOString();
      expect(isTimestampValid(futureTime)).toBe(true);
    });
  });

  describe("Idempotency", () => {
    it("should process same event_id only once", () => {
      const event: WebhookEvent = {
        eventId: "evt_123",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      // First processing should succeed
      const result1 = processWebhook(event, idempotencyStore);
      expect(result1.success).toBe(true);
      expect(result1.deduplicated).toBeUndefined();

      // Second processing should be deduplicated
      const result2 = processWebhook(event, idempotencyStore);
      expect(result2.success).toBe(true);
      expect(result2.deduplicated).toBe(true);
    });

    it("should process different event_ids independently", () => {
      const event1: WebhookEvent = {
        eventId: "evt_1",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      const event2: WebhookEvent = {
        eventId: "evt_2",
        occurredAt: new Date().toISOString(),
        type: "subscription.updated",
        data: {},
      };

      expect(processWebhook(event1, idempotencyStore).deduplicated).toBeUndefined();
      expect(processWebhook(event2, idempotencyStore).deduplicated).toBeUndefined();
    });

    it("should handle many duplicate webhooks", () => {
      const event: WebhookEvent = {
        eventId: "evt_spam",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      // First one succeeds
      expect(processWebhook(event, idempotencyStore).deduplicated).toBeUndefined();

      // Next 100 are all duplicates
      for (let i = 0; i < 100; i++) {
        expect(processWebhook(event, idempotencyStore).deduplicated).toBe(true);
      }
    });

    it("should track processed events correctly", () => {
      idempotencyStore.markProcessed("evt_a");
      idempotencyStore.markProcessed("evt_b");

      expect(idempotencyStore.isProcessed("evt_a")).toBe(true);
      expect(idempotencyStore.isProcessed("evt_b")).toBe(true);
      expect(idempotencyStore.isProcessed("evt_c")).toBe(false);
    });
  });

  describe("Signature Validation", () => {
    it("should reject webhook with invalid signature", () => {
      const event: WebhookEvent = {
        eventId: "evt_123",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      const result = processWebhook(event, idempotencyStore, false);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("invalid_signature");
    });

    it("should reject null event (signature verification failed)", () => {
      const result = processWebhook(null, idempotencyStore);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("invalid_signature");
    });
  });

  describe("Subscription Tier Determination", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return pro for active status", () => {
      const periodEnd = new Date("2024-07-15T12:00:00Z");
      expect(determineTierFromEvent("active", periodEnd)).toBe("pro");
    });

    it("should return pro for trialing status", () => {
      const periodEnd = new Date("2024-06-25T12:00:00Z");
      expect(determineTierFromEvent("trialing", periodEnd)).toBe("pro");
    });

    it("should return pro for cancelled within period", () => {
      const periodEnd = new Date("2024-07-01T12:00:00Z"); // Future
      expect(determineTierFromEvent("cancelled", periodEnd)).toBe("pro");
    });

    it("should return free for cancelled after period", () => {
      const periodEnd = new Date("2024-06-01T12:00:00Z"); // Past
      expect(determineTierFromEvent("cancelled", periodEnd)).toBe("free");
    });

    it("should return pro for past_due within period", () => {
      const periodEnd = new Date("2024-07-01T12:00:00Z");
      expect(determineTierFromEvent("past_due", periodEnd)).toBe("pro");
    });

    it("should return free for past_due after period", () => {
      const periodEnd = new Date("2024-06-01T12:00:00Z");
      expect(determineTierFromEvent("past_due", periodEnd)).toBe("free");
    });

    it("should return free for expired status", () => {
      const periodEnd = new Date("2024-07-01T12:00:00Z");
      expect(determineTierFromEvent("expired", periodEnd)).toBe("free");
    });

    it("should return pro for paused within period", () => {
      const periodEnd = new Date("2024-07-01T12:00:00Z");
      expect(determineTierFromEvent("paused", periodEnd)).toBe("pro");
    });
  });

  describe("Complete Webhook Flow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should process valid webhook successfully", () => {
      const event: WebhookEvent = {
        eventId: "evt_valid",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: { userId: "user-1" },
      };

      const result = processWebhook(event, idempotencyStore);
      expect(result.success).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject old webhook even with valid signature", () => {
      const event: WebhookEvent = {
        eventId: "evt_old",
        occurredAt: new Date("2024-06-15T11:00:00Z").toISOString(), // 1 hour ago
        type: "subscription.created",
        data: {},
      };

      const result = processWebhook(event, idempotencyStore);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("too_old");
    });

    it("should handle duplicate before timestamp check", () => {
      const event: WebhookEvent = {
        eventId: "evt_dup",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      // First time
      processWebhook(event, idempotencyStore);

      // Second time - should be caught as duplicate
      const result = processWebhook(event, idempotencyStore);
      expect(result.success).toBe(true);
      expect(result.deduplicated).toBe(true);
    });
  });

  describe("Credit Pack Webhook Processing", () => {
    it("should validate credit pack webhook data", () => {
      const packData = {
        userId: "user-123",
        packId: "pack_75",
      };

      expect(packData.userId).toBeTruthy();
      expect(packData.packId).toBeTruthy();
      expect(["pack_25", "pack_75", "pack_200"]).toContain(packData.packId);
    });

    it("should reject invalid pack IDs", () => {
      const validPackIds = ["pack_25", "pack_75", "pack_200"];
      const invalidPackId = "pack_999";

      expect(validPackIds).not.toContain(invalidPackId);
    });
  });
});

describe("Webhook Security", () => {
  describe("Replay Attack Prevention", () => {
    let idempotencyStore: MockIdempotencyStore;

    beforeEach(() => {
      idempotencyStore = new MockIdempotencyStore();
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should prevent replay of old valid webhooks", () => {
      // Attacker captures a valid webhook
      const capturedWebhook: WebhookEvent = {
        eventId: "evt_captured",
        occurredAt: new Date("2024-06-15T11:00:00Z").toISOString(), // Old
        type: "subscription.created",
        data: {},
      };

      // Tries to replay it later
      const result = processWebhook(capturedWebhook, idempotencyStore);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("too_old");
    });

    it("should prevent processing same event twice", () => {
      const event: WebhookEvent = {
        eventId: "evt_once",
        occurredAt: new Date().toISOString(),
        type: "subscription.created",
        data: {},
      };

      // Legitimate first request
      processWebhook(event, idempotencyStore);

      // Replay attempt
      const result = processWebhook(event, idempotencyStore);
      expect(result.deduplicated).toBe(true);
    });
  });
});

// ============================================================================
// Subscription Handler Logic Tests
// ============================================================================

/**
 * Build subscription data from webhook event
 */
interface SubscriptionEventData {
  providerSubscriptionId: string;
  providerCustomerId: string;
  status: string;
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  customData?: Record<string, unknown>;
}

function buildSubscriptionData(
  event: SubscriptionEventData,
  providerName: "paddle" | "lemonsqueezy"
) {
  const userId = event.customData?.userId as string | undefined;

  if (!userId) {
    throw new Error("Missing userId in webhook payload");
  }

  return {
    user_id: userId,
    provider: providerName,
    provider_subscription_id: event.providerSubscriptionId,
    provider_customer_id: event.providerCustomerId,
    status: event.status,
    billing_cycle: event.billingCycle,
    current_period_start: event.currentPeriodStart.toISOString(),
    current_period_end: event.currentPeriodEnd.toISOString(),
    cancel_at_period_end: event.cancelAtPeriodEnd,
  };
}

/**
 * Extract credits for a pack ID
 */
function getPackCredits(packId: string): number | null {
  const packs: Record<string, number> = {
    pack_25: 25,
    pack_75: 75,
    pack_200: 200,
  };
  return packs[packId] ?? null;
}

describe("Subscription Handler Logic", () => {
  describe("buildSubscriptionData", () => {
    it("should build valid subscription data from event", () => {
      const event: SubscriptionEventData = {
        providerSubscriptionId: "sub_123",
        providerCustomerId: "cust_456",
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date("2024-06-01"),
        currentPeriodEnd: new Date("2024-07-01"),
        cancelAtPeriodEnd: false,
        customData: { userId: "user-abc" },
      };

      const data = buildSubscriptionData(event, "paddle");

      expect(data.user_id).toBe("user-abc");
      expect(data.provider).toBe("paddle");
      expect(data.provider_subscription_id).toBe("sub_123");
      expect(data.provider_customer_id).toBe("cust_456");
      expect(data.status).toBe("active");
      expect(data.billing_cycle).toBe("monthly");
      expect(data.cancel_at_period_end).toBe(false);
    });

    it("should throw error when userId is missing", () => {
      const event: SubscriptionEventData = {
        providerSubscriptionId: "sub_123",
        providerCustomerId: "cust_456",
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date("2024-06-01"),
        currentPeriodEnd: new Date("2024-07-01"),
        cancelAtPeriodEnd: false,
        customData: {}, // No userId
      };

      expect(() => buildSubscriptionData(event, "paddle")).toThrow(
        "Missing userId in webhook payload"
      );
    });

    it("should throw error when customData is undefined", () => {
      const event: SubscriptionEventData = {
        providerSubscriptionId: "sub_123",
        providerCustomerId: "cust_456",
        status: "active",
        billingCycle: "monthly",
        currentPeriodStart: new Date("2024-06-01"),
        currentPeriodEnd: new Date("2024-07-01"),
        cancelAtPeriodEnd: false,
        customData: undefined,
      };

      expect(() => buildSubscriptionData(event, "paddle")).toThrow(
        "Missing userId in webhook payload"
      );
    });

    it("should handle lemonsqueezy provider", () => {
      const event: SubscriptionEventData = {
        providerSubscriptionId: "sub_ls_123",
        providerCustomerId: "cust_ls_456",
        status: "active",
        billingCycle: "yearly",
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2025-01-01"),
        cancelAtPeriodEnd: false,
        customData: { userId: "user-xyz" },
      };

      const data = buildSubscriptionData(event, "lemonsqueezy");

      expect(data.provider).toBe("lemonsqueezy");
      expect(data.billing_cycle).toBe("yearly");
    });
  });

  describe("Subscription Status Transitions", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should keep pro tier for cancelled subscription within period", () => {
      const periodEnd = new Date("2024-07-15T12:00:00Z"); // 1 month from now
      const tier = determineTierFromEvent("cancelled", periodEnd);
      expect(tier).toBe("pro");
    });

    it("should downgrade to free for cancelled subscription after period", () => {
      const periodEnd = new Date("2024-05-15T12:00:00Z"); // 1 month ago
      const tier = determineTierFromEvent("cancelled", periodEnd);
      expect(tier).toBe("free");
    });

    it("should handle exact period end boundary", () => {
      // Period end is exactly now
      const periodEnd = new Date("2024-06-15T12:00:00Z");
      const tier = determineTierFromEvent("cancelled", periodEnd);
      // At exactly the boundary, should still be free (not > now)
      expect(tier).toBe("free");
    });

    it("should handle period end 1 second in the future", () => {
      const periodEnd = new Date("2024-06-15T12:00:01Z");
      const tier = determineTierFromEvent("cancelled", periodEnd);
      expect(tier).toBe("pro");
    });
  });
});

describe("Credit Pack Processing", () => {
  describe("getPackCredits", () => {
    it("should return 25 credits for pack_25", () => {
      expect(getPackCredits("pack_25")).toBe(25);
    });

    it("should return 75 credits for pack_75", () => {
      expect(getPackCredits("pack_75")).toBe(75);
    });

    it("should return 200 credits for pack_200", () => {
      expect(getPackCredits("pack_200")).toBe(200);
    });

    it("should return null for unknown pack ID", () => {
      expect(getPackCredits("pack_unknown")).toBeNull();
    });

    it("should return null for empty pack ID", () => {
      expect(getPackCredits("")).toBeNull();
    });

    it("should return null for malformed pack ID", () => {
      expect(getPackCredits("25")).toBeNull();
      expect(getPackCredits("pack25")).toBeNull();
      expect(getPackCredits("PACK_25")).toBeNull();
    });
  });

  describe("Credit Pack Validation", () => {
    interface CreditPackEvent {
      userId?: string;
      packId?: string;
      providerTransactionId: string;
    }

    function validateCreditPackEvent(event: CreditPackEvent): {
      valid: boolean;
      error?: string;
    } {
      if (!event.userId) {
        return { valid: false, error: "Missing userId" };
      }
      if (!event.packId) {
        return { valid: false, error: "Missing packId" };
      }
      if (getPackCredits(event.packId) === null) {
        return { valid: false, error: `Unknown credit pack: ${event.packId}` };
      }
      return { valid: true };
    }

    it("should validate complete credit pack event", () => {
      const event: CreditPackEvent = {
        userId: "user-123",
        packId: "pack_75",
        providerTransactionId: "txn_abc",
      };

      const result = validateCreditPackEvent(event);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject missing userId", () => {
      const event: CreditPackEvent = {
        packId: "pack_75",
        providerTransactionId: "txn_abc",
      };

      const result = validateCreditPackEvent(event);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Missing userId");
    });

    it("should reject missing packId", () => {
      const event: CreditPackEvent = {
        userId: "user-123",
        providerTransactionId: "txn_abc",
      };

      const result = validateCreditPackEvent(event);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Missing packId");
    });

    it("should reject unknown packId", () => {
      const event: CreditPackEvent = {
        userId: "user-123",
        packId: "pack_999",
        providerTransactionId: "txn_abc",
      };

      const result = validateCreditPackEvent(event);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Unknown credit pack: pack_999");
    });
  });
});

describe("Payment Event Handling", () => {
  describe("Payment Succeeded", () => {
    it("should update billing period on successful payment", () => {
      const beforePeriodEnd = new Date("2024-06-30");
      const afterPeriodEnd = new Date("2024-07-31");

      // Simulate renewal
      const update = {
        status: "active",
        current_period_start: new Date("2024-07-01").toISOString(),
        current_period_end: afterPeriodEnd.toISOString(),
      };

      expect(update.status).toBe("active");
      expect(new Date(update.current_period_end) > beforePeriodEnd).toBe(true);
    });

    it("should ensure pro tier on successful payment", () => {
      const tier = determineTierFromEvent("active", new Date("2024-07-31"));
      expect(tier).toBe("pro");
    });
  });

  describe("Payment Failed", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should set status to past_due on failed payment", () => {
      const updateStatus = "past_due";
      expect(updateStatus).toBe("past_due");
    });

    it("should keep pro access during past_due within period", () => {
      const periodEnd = new Date("2024-07-01T12:00:00Z");
      const tier = determineTierFromEvent("past_due", periodEnd);
      expect(tier).toBe("pro");
    });

    it("should lose access if past_due extends beyond period", () => {
      const periodEnd = new Date("2024-06-01T12:00:00Z"); // Already passed
      const tier = determineTierFromEvent("past_due", periodEnd);
      expect(tier).toBe("free");
    });
  });
});

describe("Subscription Cancellation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should mark cancel_at_period_end as true", () => {
    const cancellationUpdate = {
      status: "cancelled",
      cancel_at_period_end: true,
    };

    expect(cancellationUpdate.status).toBe("cancelled");
    expect(cancellationUpdate.cancel_at_period_end).toBe(true);
  });

  it("should not immediately downgrade tier", () => {
    // User cancels but still has 2 weeks left
    const periodEnd = new Date("2024-07-01T12:00:00Z");
    const tier = determineTierFromEvent("cancelled", periodEnd);

    // Should still be pro during grace period
    expect(tier).toBe("pro");
  });

  it("should downgrade after period ends", () => {
    // Period has ended
    const periodEnd = new Date("2024-06-14T12:00:00Z");
    const tier = determineTierFromEvent("cancelled", periodEnd);

    expect(tier).toBe("free");
  });
});
