"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { subscriptionRepository } from "@/lib/repositories";
import { getPaymentProvider, type PortalSession } from "@/lib/payments";

/**
 * Get the billing portal URL for managing subscription
 */
export async function getPortalUrl(): Promise<ActionResult<PortalSession>> {
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
      return error("No subscription found", "NOT_FOUND");
    }

    // Get portal URL from payment provider
    const provider = getPaymentProvider();
    const portal = await provider.getPortalUrl(subscription.provider_customer_id);

    return success(portal);
  } catch (err) {
    console.error("Failed to get portal URL:", err);
    return error("Failed to get billing portal", "INTERNAL_ERROR");
  }
}
