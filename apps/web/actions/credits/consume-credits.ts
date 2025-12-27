"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { creditsRepository } from "@/lib/repositories";
import { AI_FEATURE_COSTS } from "@/lib/payments";
import type { AIFeatureId, UserCredits } from "@repo/database";
import { z } from "zod";

const consumeCreditsSchema = z.object({
  featureId: z.enum([
    "insights",
    "budget_improvement",
    "expense_analysis",
    "savings_recommendations",
  ]),
});

export interface ConsumeResult {
  consumed: number;
  balanceAfter: number;
  featureId: AIFeatureId;
}

/**
 * Check if user can use an AI feature (has enough credits)
 */
export async function canUseAIFeature(
  featureId: AIFeatureId
): Promise<ActionResult<{ canUse: boolean; cost: number; balance: number }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = consumeCreditsSchema.safeParse({ featureId });
  if (!validation.success) {
    return error("Invalid feature ID", "VALIDATION_ERROR");
  }

  try {
    const credits = await creditsRepository.getOrCreate(supabase, userId);
    const cost = AI_FEATURE_COSTS[featureId]?.creditCost ?? 1;

    return success({
      canUse: credits.balance >= cost,
      cost,
      balance: credits.balance,
    });
  } catch (err) {
    console.error("Failed to check feature access:", err);
    return error("Failed to check feature access", "DATABASE_ERROR");
  }
}

/**
 * Consume credits for an AI feature
 * Returns error if insufficient credits
 */
export async function consumeCredits(
  featureId: AIFeatureId,
  description?: string
): Promise<ActionResult<ConsumeResult>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = consumeCreditsSchema.safeParse({ featureId });
  if (!validation.success) {
    return error("Invalid feature ID", "VALIDATION_ERROR");
  }

  try {
    const featureConfig = AI_FEATURE_COSTS[featureId];
    const cost = featureConfig?.creditCost ?? 1;
    const featureName = featureConfig?.name ?? featureId;

    const result = await creditsRepository.consumeCredits(
      supabase,
      userId,
      cost,
      featureId,
      description ?? `Used ${featureName}`
    );

    if (!result) {
      return error(
        `Insufficient credits. You need ${cost} credits for ${featureName}.`,
        "FORBIDDEN"
      );
    }

    return success({
      consumed: cost,
      balanceAfter: result.balance,
      featureId,
    });
  } catch (err) {
    console.error("Failed to consume credits:", err);
    return error("Failed to consume credits", "DATABASE_ERROR");
  }
}

/**
 * Higher-order function to wrap AI operations with credit consumption
 * Checks credits, runs operation, consumes credits on success
 */
export async function withCredits<T>(
  featureId: AIFeatureId,
  operation: () => Promise<ActionResult<T>>,
  description?: string
): Promise<ActionResult<T & { creditsConsumed: number; creditsRemaining: number }>> {
  // Check if user can use the feature
  const checkResult = await canUseAIFeature(featureId);
  if (!checkResult.success) return checkResult;

  if (!checkResult.data.canUse) {
    const featureName = AI_FEATURE_COSTS[featureId]?.name ?? featureId;
    return error(
      `Insufficient credits. You need ${checkResult.data.cost} credits for ${featureName}. Current balance: ${checkResult.data.balance}`,
      "FORBIDDEN"
    );
  }

  // Run the operation
  const operationResult = await operation();
  if (!operationResult.success) {
    return operationResult;
  }

  // Consume credits on success
  const consumeResult = await consumeCredits(featureId, description);
  if (!consumeResult.success) {
    // Operation succeeded but credit consumption failed
    // This shouldn't happen if we checked beforehand, but handle gracefully
    console.error("Credit consumption failed after successful operation");
    return consumeResult;
  }

  return success({
    ...operationResult.data,
    creditsConsumed: consumeResult.data.consumed,
    creditsRemaining: consumeResult.data.balanceAfter,
  });
}
