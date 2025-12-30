"use server";

import { revalidatePath } from "next/cache";
import { incomeRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Income } from "@repo/database";

export async function deleteIncome(id: string): Promise<ActionResult<Income>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Soft delete (deactivate) the income
    const income = await incomeRepository.deactivate(supabase, id, userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(income);
  } catch (err) {
    console.error("Failed to delete income:", err);
    return error("Failed to delete income", "DATABASE_ERROR");
  }
}
