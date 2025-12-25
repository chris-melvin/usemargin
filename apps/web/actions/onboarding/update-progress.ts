"use server";

import { revalidatePath } from "next/cache";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { UserOnboarding } from "@repo/database";

/**
 * Advance to the next onboarding step
 */
export async function advanceOnboardingStep(): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.advanceStep(supabase, userId);
    revalidatePath("/");
    return success(onboarding);
  } catch (err) {
    console.error("Failed to advance onboarding step:", err);
    return error("Failed to update onboarding progress", "DATABASE_ERROR");
  }
}

/**
 * Mark the onboarding tour as complete
 */
export async function completeOnboarding(): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.completeTour(supabase, userId);
    revalidatePath("/");
    return success(onboarding);
  } catch (err) {
    console.error("Failed to complete onboarding:", err);
    return error("Failed to complete onboarding", "DATABASE_ERROR");
  }
}

/**
 * Skip the onboarding tour
 */
export async function skipOnboarding(): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.skipTour(supabase, userId);
    revalidatePath("/");
    return success(onboarding);
  } catch (err) {
    console.error("Failed to skip onboarding:", err);
    return error("Failed to skip onboarding", "DATABASE_ERROR");
  }
}
