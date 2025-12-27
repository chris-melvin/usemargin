"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type ActionResult, error, success } from "./errors";
import { checkFeatureAccess, consumeCreditsForFeature } from "./access-control";
import type { GatedFeature } from "@/lib/payments";
import type { AIFeatureId } from "@repo/database";

/**
 * Authenticated user data returned from requireAuth
 */
export interface AuthData {
  userId: string;
  email: string | undefined;
  supabase: SupabaseClient;
}

/**
 * Require authentication for a server action
 * Returns the authenticated user's ID and a Supabase client, or an error
 */
export async function requireAuth(): Promise<ActionResult<AuthData>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return error("You must be logged in to perform this action", "UNAUTHORIZED");
  }

  return success({
    userId: user.id,
    email: user.email,
    supabase,
  });
}

/**
 * Get the current user without requiring auth (for optional auth scenarios)
 */
export async function getOptionalAuth(): Promise<AuthData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    supabase,
  };
}

/**
 * Wrapper for database operations with consistent error handling
 */
export async function withDbError<T>(
  operation: () => Promise<T>,
  errorMessage = "Database operation failed"
): Promise<ActionResult<T>> {
  try {
    const result = await operation();
    return success(result);
  } catch (err) {
    console.error("Database error:", err);
    return error(errorMessage, "DATABASE_ERROR");
  }
}

/**
 * Combine requireAuth with a database operation
 */
export async function withAuth<T>(
  operation: (auth: AuthData) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult;
  }
  return operation(authResult.data);
}

// =============================================================================
// FEATURE ACCESS UTILITIES
// =============================================================================

/**
 * Require feature access for a server action
 * Checks auth and feature gate (subscription or credits)
 */
export async function requireFeatureAccess(
  feature: GatedFeature
): Promise<ActionResult<AuthData>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const { userId, supabase } = authResult.data;

  const accessResult = await checkFeatureAccess(supabase, userId, feature);

  if (!accessResult.hasAccess) {
    const errorCode =
      accessResult.reason === "subscription_required" ? "FORBIDDEN" : "RATE_LIMITED";
    return error(
      accessResult.upgradePrompt?.description ?? "Feature not available",
      errorCode
    );
  }

  return authResult;
}

/**
 * Wrapper that checks auth, feature access, and runs operation
 * For subscription-gated features (no credit consumption)
 */
export async function withFeatureAccess<T>(
  feature: GatedFeature,
  operation: (auth: AuthData) => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  const authResult = await requireFeatureAccess(feature);
  if (!authResult.success) return authResult;

  return operation(authResult.data);
}

/**
 * Wrapper for credit-based features
 * Checks auth, verifies credits, runs operation, consumes credits on success
 */
export async function withCredits<T>(
  featureId: AIFeatureId,
  operation: (auth: AuthData) => Promise<ActionResult<T>>,
  options?: { description?: string }
): Promise<ActionResult<T & { creditsConsumed: number; creditsRemaining: number }>> {
  // Check auth and feature access
  const authResult = await requireFeatureAccess(featureId);
  if (!authResult.success) return authResult;

  const { userId, supabase } = authResult.data;

  // Run the operation
  const result = await operation(authResult.data);
  if (!result.success) return result;

  // Consume credits on success
  const consumeResult = await consumeCreditsForFeature(
    supabase,
    userId,
    featureId,
    options?.description
  );

  if (!consumeResult.success) {
    // This shouldn't happen if we checked beforehand
    return error(
      `Failed to consume credits. Balance: ${consumeResult.balance}`,
      "RATE_LIMITED"
    );
  }

  return success({
    ...result.data,
    creditsConsumed: 1, // Could be dynamic based on feature
    creditsRemaining: consumeResult.balance,
  });
}
