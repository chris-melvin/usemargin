"use server";

import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import { settingsRepository } from "@/lib/repositories";
import type { UserSettings, UserSettingsUpdate } from "@repo/database";

/**
 * Update user settings
 */
export async function updateSettings(
  data: UserSettingsUpdate
): Promise<ActionResult<UserSettings>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const updated = await settingsRepository.update(supabase, userId, data);
    return success(updated);
  } catch (err) {
    console.error("Failed to update settings:", err);
    return error("Failed to update settings", "DATABASE_ERROR");
  }
}
