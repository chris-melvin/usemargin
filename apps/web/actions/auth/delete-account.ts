"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";

/**
 * Permanently delete the current user's account and all associated data.
 */
export async function deleteAccount(): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { supabase } = authResult.data;

  try {
    // Delete user via RPC (cascades all data)
    const { error: rpcError } = await supabase.rpc("delete_own_account");
    if (rpcError) throw rpcError;

    // Explicitly invalidate the session
    await supabase.auth.signOut();

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete account:", err);
    return error(
      "Failed to delete account. Please try again or contact support.",
      "INTERNAL_ERROR"
    );
  }
}
