"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { subscriptionRepository } from "@/lib/repositories";
import { getPaymentProvider } from "@/lib/payments";

export interface CancelResult {
  cancelledAt: string;
  periodEnd: string;
}

/**
 * Cancel the current user's subscription
 * Subscription remains active until the end of the current billing period
 */
export async function cancelSubscription(): Promise<ActionResult<CancelResult>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Get current subscription
    const subscription = await subscriptionRepository.getByUserId(
      supabase,
      userId
    );

    if (!subscription) {
      return error("No active subscription found", "NOT_FOUND");
    }

    if (subscription.status === "cancelled" || subscription.status === "expired") {
      return error("Subscription is already cancelled", "CONFLICT");
    }

    // Cancel via payment provider (sets cancel_at_period_end)
    const provider = getPaymentProvider();
    await provider.cancelSubscription(subscription.provider_subscription_id);

    // Note: The webhook will update our database
    // But we can optimistically update cancel_at_period_end

    revalidatePath("/settings");
    revalidatePath("/");

    return success({
      cancelledAt: new Date().toISOString(),
      periodEnd: subscription.current_period_end,
    });
  } catch (err) {
    console.error("Failed to cancel subscription:", err);
    return error("Failed to cancel subscription", "INTERNAL_ERROR");
  }
}

/**
 * Resume a cancelled subscription (if still within billing period)
 */
export async function resumeSubscription(): Promise<ActionResult<{ resumedAt: string }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const subscription = await subscriptionRepository.getByUserId(
      supabase,
      userId
    );

    if (!subscription) {
      return error("No subscription found", "NOT_FOUND");
    }

    if (!subscription.cancel_at_period_end) {
      return error("Subscription is not scheduled for cancellation", "CONFLICT");
    }

    // Check if still within period
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd <= new Date()) {
      return error("Subscription period has already ended", "CONFLICT");
    }

    // Resume via payment provider
    const provider = getPaymentProvider();
    await provider.resumeSubscription(subscription.provider_subscription_id);

    revalidatePath("/settings");
    revalidatePath("/");

    return success({
      resumedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to resume subscription:", err);
    return error("Failed to resume subscription", "INTERNAL_ERROR");
  }
}
