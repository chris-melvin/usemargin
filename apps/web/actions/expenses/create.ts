"use server";

import { revalidatePath } from "next/cache";
import { createExpenseSchema } from "@/lib/validations";
import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Expense } from "@repo/database";

export async function createExpense(
  formData: FormData
): Promise<ActionResult<Expense>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // 2. Parse and validate input
  const rawData = {
    date: formData.get("date"),
    amount: formData.get("amount"),
    label: formData.get("label"),
    category: formData.get("category") || null,
    notes: formData.get("notes") || null,
    time_of_day: formData.get("time_of_day") || null,
  };

  const validation = createExpenseSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  // 3. Execute repository operation
  try {
    const expense = await expenseRepository.create(supabase, {
      user_id: userId,
      date: validation.data.date,
      amount: validation.data.amount,
      label: validation.data.label,
      category: validation.data.category ?? null,
      category_id: null,
      notes: validation.data.notes ?? null,
      time_of_day: validation.data.time_of_day ?? null,
      recurring_expense_id: null,
    });

    // 4. Revalidate cache
    revalidatePath("/");
    revalidatePath("/analytics");

    return success(expense);
  } catch (err) {
    console.error("Failed to create expense:", err);
    return error("Failed to create expense", "DATABASE_ERROR");
  }
}

/**
 * Create expense from parsed data (for programmatic use)
 */
export async function createExpenseFromData(data: {
  date: string;
  amount: number;
  label: string;
  category?: string | null;
  notes?: string | null;
  bucket_id?: string | null;
}): Promise<ActionResult<Expense>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createExpenseSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const expense = await expenseRepository.create(supabase, {
      user_id: userId,
      date: validation.data.date,
      amount: validation.data.amount,
      label: validation.data.label,
      category: validation.data.category ?? null,
      category_id: null,
      notes: validation.data.notes ?? null,
      time_of_day: null,
      recurring_expense_id: null,
      bucket_id: validation.data.bucket_id ?? null,
    });

    revalidatePath("/");
    revalidatePath("/analytics");

    return success(expense);
  } catch (err) {
    console.error("Failed to create expense:", err);
    return error("Failed to create expense", "DATABASE_ERROR");
  }
}
