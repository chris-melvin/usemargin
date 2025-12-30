"use server";

import { revalidatePath } from "next/cache";
import { incomeRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Income } from "@repo/database";

export async function markIncomeReceived(
  id: string,
  receivedDate?: string
): Promise<ActionResult<Income>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const income = await incomeRepository.markAsReceived(
      supabase,
      id,
      userId,
      receivedDate
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(income);
  } catch (err) {
    console.error("Failed to mark income as received:", err);
    return error("Failed to mark income as received", "DATABASE_ERROR");
  }
}

export async function resetIncomeStatus(id: string): Promise<ActionResult<Income>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const income = await incomeRepository.resetStatus(supabase, id, userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(income);
  } catch (err) {
    console.error("Failed to reset income status:", err);
    return error("Failed to reset income status", "DATABASE_ERROR");
  }
}
