"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { expenseRepository } from "@/lib/repositories/expense.repository";
import type { Expense } from "@repo/database";

export type RestoreExpenseResult =
  | { success: true; data: Expense }
  | { success: false; error: string };

/**
 * Restore a soft-deleted expense
 */
export async function restoreExpense(
  expenseId: string
): Promise<RestoreExpenseResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const restored = await expenseRepository.restore(
      supabase,
      expenseId,
      user.id
    );

    if (!restored) {
      return { success: false, error: "Expense not found or already restored" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: restored };
  } catch (error) {
    console.error("Failed to restore expense:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore expense",
    };
  }
}
