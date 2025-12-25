"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type ActionResult, error, success } from "./errors";

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
