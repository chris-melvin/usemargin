"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { creditsRepository, creditTransactionRepository } from "@/lib/repositories";
import type { CreditTransaction } from "@repo/database";

export interface CreditBalance {
  balance: number;
  subscriptionCreditsPerMonth: number;
  isSubscriber: boolean;
  canUseAI: boolean;
  totalGranted: number;
  totalConsumed: number;
  totalPurchased: number;
}

/**
 * Get the current user's credit balance and stats
 */
export async function getCreditBalance(): Promise<ActionResult<CreditBalance>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const credits = await creditsRepository.getOrCreate(supabase, userId);

    return success({
      balance: credits.balance,
      subscriptionCreditsPerMonth: credits.subscription_credits_per_month,
      isSubscriber: credits.subscription_credits_per_month > 0,
      canUseAI: credits.balance > 0,
      totalGranted: credits.total_granted,
      totalConsumed: credits.total_consumed,
      totalPurchased: credits.total_purchased,
    });
  } catch (err) {
    console.error("Failed to get credit balance:", err);
    return error("Failed to get credit balance", "DATABASE_ERROR");
  }
}

/**
 * Get recent credit transactions for the user
 */
export async function getCreditHistory(
  limit = 20,
  offset = 0
): Promise<ActionResult<CreditTransaction[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const transactions = await creditTransactionRepository.findByUser(
      supabase,
      userId,
      { limit, offset }
    );

    return success(transactions);
  } catch (err) {
    console.error("Failed to get credit history:", err);
    return error("Failed to get credit history", "DATABASE_ERROR");
  }
}
