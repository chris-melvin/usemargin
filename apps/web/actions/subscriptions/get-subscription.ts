"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { subscriptionRepository, settingsRepository } from "@/lib/repositories";
import type { Subscription, SubscriptionTier, SubscriptionStatus } from "@repo/database";

export interface SubscriptionInfo {
  isSubscribed: boolean;
  tier: SubscriptionTier;
  status: SubscriptionStatus | null;
  subscription: Subscription | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the current user's subscription information
 */
export async function getSubscription(): Promise<ActionResult<SubscriptionInfo>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Get subscription from database
    const subscription = await subscriptionRepository.getByUserId(
      supabase,
      userId
    );

    // Determine if user has active access
    let isSubscribed = false;
    let tier: SubscriptionTier = "free";

    if (subscription) {
      const activeStatuses: SubscriptionStatus[] = [
        "active",
        "trialing",
        "past_due",
        "cancelled", // Still active until period end
      ];

      if (activeStatuses.includes(subscription.status)) {
        // Check if period has ended
        const periodEnd = new Date(subscription.current_period_end);
        isSubscribed = periodEnd > new Date();
        tier = isSubscribed ? "pro" : "free";
      }
    }

    return success({
      isSubscribed,
      tier,
      status: subscription?.status ?? null,
      subscription,
      periodEnd: subscription?.current_period_end ?? null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    });
  } catch (err) {
    console.error("Failed to get subscription:", err);
    return error("Failed to get subscription", "DATABASE_ERROR");
  }
}

/**
 * Get subscription tier from user settings (cached, faster)
 * Use this for quick tier checks without full subscription details
 */
export async function getSubscriptionTier(): Promise<ActionResult<SubscriptionTier>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const settings = await settingsRepository.getOrCreate(supabase, userId);
    // subscription_tier is added in migration 0006
    const tier = (settings as { subscription_tier?: SubscriptionTier }).subscription_tier ?? "free";
    return success(tier);
  } catch (err) {
    console.error("Failed to get subscription tier:", err);
    return error("Failed to get subscription tier", "DATABASE_ERROR");
  }
}
