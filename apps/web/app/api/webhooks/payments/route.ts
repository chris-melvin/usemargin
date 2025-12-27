import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider, SUBSCRIPTION_TIERS, getCreditPack } from "@/lib/payments";
import type { PaymentEvent, OneTimePaymentEvent } from "@/lib/payments";
import { subscriptionRepository, creditsRepository, settingsRepository } from "@/lib/repositories";
import type { SubscriptionInsert, SubscriptionUpdate } from "@repo/database";

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

  // Create service client (bypasses RLS)
  const supabase = createServiceClient();

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
 * Handle new subscription created
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

  // Create subscription record
  const subscriptionData: SubscriptionInsert = {
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

  await subscriptionRepository.upsert(supabase, subscriptionData);

  // Update user_settings.subscription_tier
  await settingsRepository.upsert(supabase, userId, {
    subscription_tier: "pro",
  } as Record<string, unknown>);

  // Grant initial subscription credits
  const creditsPerMonth = SUBSCRIPTION_TIERS.pro.creditsPerMonth;
  await creditsRepository.addCredits(
    supabase,
    userId,
    creditsPerMonth,
    "subscription_grant",
    "Initial Pro subscription credits"
  );

  // Set credits per month for future refreshes
  await creditsRepository.setSubscriptionCredits(
    supabase,
    userId,
    creditsPerMonth
  );

  console.log(`Subscription created for user ${userId}`);
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

  // Update tier based on status
  const activeTier =
    event.status === "active" || event.status === "trialing"
      ? "pro"
      : "free";

  await settingsRepository.upsert(supabase, existing.user_id, {
    subscription_tier: activeTier,
  } as Record<string, unknown>);

  console.log(`Subscription updated for user ${existing.user_id}`);
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
