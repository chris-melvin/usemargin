"use server";

import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { UserOnboarding } from "@repo/database";

/**
 * Dismiss a progressive hint (mark as seen and acknowledged)
 */
export async function dismissProgressiveHint(
  hintId: string
): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.dismissHint(
      supabase,
      userId,
      hintId
    );
    return success(onboarding);
  } catch (err) {
    console.error("Failed to dismiss hint:", err);
    return error("Failed to dismiss hint", "DATABASE_ERROR");
  }
}

/**
 * Track when a user discovers a feature (for progressive hints)
 */
export async function trackFeatureDiscovery(
  featureId: string
): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.trackFeatureDiscovery(
      supabase,
      userId,
      featureId
    );
    return success(onboarding);
  } catch (err) {
    console.error("Failed to track feature discovery:", err);
    return error("Failed to track feature", "DATABASE_ERROR");
  }
}

/**
 * Increment expense count (for usage-based progressive hints)
 */
export async function incrementExpenseCount(): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.incrementExpenseCount(
      supabase,
      userId
    );
    return success(onboarding);
  } catch (err) {
    console.error("Failed to increment expense count:", err);
    return error("Failed to update expense count", "DATABASE_ERROR");
  }
}
