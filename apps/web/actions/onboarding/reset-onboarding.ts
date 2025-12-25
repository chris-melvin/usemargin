"use server";

import { revalidatePath } from "next/cache";
import { onboardingRepository } from "@/lib/repositories/onboarding.repository";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { UserOnboarding } from "@repo/database";

/**
 * Reset onboarding to start the tutorial from scratch
 */
export async function resetOnboarding(): Promise<ActionResult<UserOnboarding>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const onboarding = await onboardingRepository.reset(supabase, userId);
    revalidatePath("/");
    return success(onboarding);
  } catch (err) {
    console.error("Failed to reset onboarding:", err);
    return error("Failed to reset onboarding", "DATABASE_ERROR");
  }
}
