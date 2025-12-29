import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider, SUBSCRIPTION_TIERS, getCreditPack } from "@/lib/payments";
import type { PaymentEvent, OneTimePaymentEvent } from "@/lib/payments";
import {
  subscriptionRepository,
  creditsRepository,
  creditTransactionRepository,
  processedWebhookRepository,
  settingsRepository,
} from "@/lib/repositories";
import type { SubscriptionUpdate } from "@repo/database";

// Webhook timestamp tolerance (5 minutes)
const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Webhook handler for payment provider events
 *
 * Handles:
 * - subscription.created - New subscription
 * - subscription.updated - Status changes, renewals
 * - subscription.cancelled - Cancellation scheduled
 * - subscription.payment_succeeded - Successful payment
 * - subscription.payment_failed - Failed payment
 * - one_time.completed - Credit pack purchase
 *
 * Security:
 * - Signature verification via provider.parseWebhook()
 * - Timestamp validation (reject old webhooks)
 * - Idempotency (deduplicate by event_id)
 */
export async function POST(request: NextRequest) {
  const payload = await request.text();

  // Get signature from headers (varies by provider)
  const signature =
    request.headers.get("paddle-signature") ??
    request.headers.get("x-signature") ??
    request.headers.get("x-webhook-signature") ??
    "";

  // Verify and parse webhook
  const provider = getPaymentProvider();
  const event = await provider.parseWebhook(payload, signature);

  if (!event) {
    console.error("Webhook verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Validate timestamp (reject old webhooks to prevent replay attacks)
  if (event.occurredAt) {
    const eventTime = new Date(event.occurredAt).getTime();
    const now = Date.now();
    if (now - eventTime > WEBHOOK_TIMESTAMP_TOLERANCE_MS) {
      console.warn(`Webhook too old: ${event.eventId}, occurred at ${event.occurredAt}`);
      return NextResponse.json(
        { error: "Webhook timestamp too old" },
        { status: 400 }
      );
    }
  }

  // Create service client (bypasses RLS)
  const supabase = createServiceClient();

  // Idempotency check: skip if already processed
  if (event.eventId) {
    const wasProcessed = await processedWebhookRepository.markProcessed(
      supabase,
      event.eventId,
      event.type
    );

    if (!wasProcessed) {
      console.log(`Webhook already processed: ${event.eventId}`);
      return NextResponse.json({ received: true, deduplicated: true });
    }
  }

  try {
    // Handle one-time payment (credit pack)
    if (event.type === "one_time.completed") {
      await handleCreditPackPurchase(supabase, event as OneTimePaymentEvent);
      return NextResponse.json({ received: true });
    }

    // Handle subscription events
    await handleSubscriptionEvent(supabase, event as PaymentEvent, provider.name);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription events
 */
async function handleSubscriptionEvent(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent,
  providerName: "paddle" | "lemonsqueezy"
) {
  console.log(`Processing ${event.type} event for subscription ${event.providerSubscriptionId}`);

  switch (event.type) {
    case "subscription.created":
      await handleSubscriptionCreated(supabase, event, providerName);
      break;

    case "subscription.updated":
      await handleSubscriptionUpdated(supabase, event);
      break;

    case "subscription.cancelled":
      await handleSubscriptionCancelled(supabase, event);
      break;

    case "subscription.payment_succeeded":
      await handlePaymentSucceeded(supabase, event);
      break;

    case "subscription.payment_failed":
      await handlePaymentFailed(supabase, event);
      break;

    default:
      console.log(`Unhandled subscription event: ${event.type}`);
  }
}

/**
 * Handle new subscription created (ATOMIC)
 * Uses PostgreSQL function to ensure all operations succeed or all fail
 */
async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent,
  providerName: "paddle" | "lemonsqueezy"
) {
  // Extract userId from custom data (passed during checkout)
  const userId = event.customData?.userId as string;

  if (!userId) {
    console.error("No userId in webhook custom data");
    throw new Error("Missing userId in webhook payload");
  }

  const creditsPerMonth = SUBSCRIPTION_TIERS.pro.creditsPerMonth;

  // Use atomic RPC function to ensure all operations succeed or all fail
  // This prevents partial states where subscription exists but credits weren't granted
  const { data, error } = await supabase.rpc("handle_subscription_created", {
    p_user_id: userId,
    p_provider: providerName,
    p_provider_subscription_id: event.providerSubscriptionId,
    p_provider_customer_id: event.providerCustomerId,
    p_status: event.status,
    p_billing_cycle: event.billingCycle,
    p_current_period_start: event.currentPeriodStart.toISOString(),
    p_current_period_end: event.currentPeriodEnd.toISOString(),
    p_cancel_at_period_end: event.cancelAtPeriodEnd,
    p_credits_per_month: creditsPerMonth,
    p_subscription_tier: "pro",
  });

  if (error) {
    console.error("Failed to create subscription atomically:", error);
    throw error;
  }

  console.log(`Subscription created for user ${userId}:`, data);
}

/**
 * Handle subscription updated (status change, renewal, etc.)
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent
) {
  // Find existing subscription
  const existing = await subscriptionRepository.getByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId
  );

  if (!existing) {
    console.error(
      `Subscription not found: ${event.providerSubscriptionId}`
    );
    return;
  }

  // Update subscription
  const updateData: SubscriptionUpdate = {
    status: event.status,
    billing_cycle: event.billingCycle,
    current_period_start: event.currentPeriodStart.toISOString(),
    current_period_end: event.currentPeriodEnd.toISOString(),
    cancel_at_period_end: event.cancelAtPeriodEnd,
  };

  await subscriptionRepository.updateByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId,
    updateData
  );

  // Determine tier based on status AND period end
  // User keeps 'pro' access until their period actually expires
  let tier: "pro" | "free" = "free";

  if (event.status === "active" || event.status === "trialing") {
    // Clearly active subscription
    tier = "pro";
  } else if (
    event.status === "cancelled" ||
    event.status === "past_due" ||
    event.status === "paused"
  ) {
    // User might still have access until period end
    const periodEnd = new Date(event.currentPeriodEnd);
    if (periodEnd > new Date()) {
      tier = "pro"; // Still within paid period
    }
  }
  // 'expired' status = definitely free

  await settingsRepository.upsert(supabase, existing.user_id, {
    subscription_tier: tier,
  } as Record<string, unknown>);

  console.log(`Subscription updated for user ${existing.user_id}, tier: ${tier}`);
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent
) {
  const existing = await subscriptionRepository.getByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId
  );

  if (!existing) {
    console.error(
      `Subscription not found: ${event.providerSubscriptionId}`
    );
    return;
  }

  await subscriptionRepository.updateByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId,
    {
      status: "cancelled",
      cancel_at_period_end: true,
    }
  );

  // Note: Don't downgrade to free yet - user has access until period end
  // A scheduled job should check current_period_end and downgrade expired subs

  console.log(`Subscription cancelled for user ${existing.user_id}`);
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent
) {
  const existing = await subscriptionRepository.getByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId
  );

  if (!existing) {
    return;
  }

  // Update billing period
  await subscriptionRepository.updateByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId,
    {
      status: "active",
      current_period_start: event.currentPeriodStart.toISOString(),
      current_period_end: event.currentPeriodEnd.toISOString(),
    }
  );

  // Ensure user has pro tier
  await settingsRepository.upsert(supabase, existing.user_id, {
    subscription_tier: "pro",
  } as Record<string, unknown>);

  console.log(`Payment succeeded for user ${existing.user_id}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createServiceClient>,
  event: PaymentEvent
) {
  await subscriptionRepository.updateByProviderSubscriptionId(
    supabase,
    event.providerSubscriptionId,
    {
      status: "past_due",
    }
  );

  console.log(`Payment failed for subscription ${event.providerSubscriptionId}`);

  // Could trigger email notification here
}

/**
 * Handle credit pack purchase
 */
async function handleCreditPackPurchase(
  supabase: ReturnType<typeof createServiceClient>,
  event: OneTimePaymentEvent
) {
  const userId = event.customData?.userId as string;
  const packId = event.customData?.packId as string;

  if (!userId || !packId) {
    console.error("Missing userId or packId in credit pack webhook");
    throw new Error("Missing required data in webhook payload");
  }

  const pack = getCreditPack(packId);
  if (!pack) {
    console.error(`Unknown credit pack: ${packId}`);
    throw new Error(`Unknown credit pack: ${packId}`);
  }

  // Add credits to user's balance
  await creditsRepository.addCredits(
    supabase,
    userId,
    pack.credits,
    "purchase",
    `Purchased ${pack.name} (${pack.credits} credits)`,
    event.providerTransactionId
  );

  console.log(
    `Credit pack ${packId} purchased by user ${userId}: +${pack.credits} credits`
  );
}
