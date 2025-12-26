"use server";

import { revalidatePath } from "next/cache";
import { updateExpenseSchema, expenseIdSchema } from "@/lib/validations";
import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Expense } from "@repo/database";

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult<Expense>> {
  // 1. Authentication check
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // 2. Validate ID
  const idValidation = expenseIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return error("Invalid expense ID", "VALIDATION_ERROR");
  }

  // 3. Parse and validate input
  const rawData: Record<string, unknown> = {};

  const date = formData.get("date");
  if (date) rawData.date = date;

  const amount = formData.get("amount");
  if (amount) rawData.amount = amount;

  const label = formData.get("label");
  if (label) rawData.label = label;

  const category = formData.get("category");
  if (category !== null) rawData.category = category || null;

  const notes = formData.get("notes");
  if (notes !== null) rawData.notes = notes || null;

  const bucket_id = formData.get("bucket_id");
  if (bucket_id !== null) rawData.bucket_id = bucket_id || null;

  const validation = updateExpenseSchema.safeParse(rawData);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  // 4. Check if expense exists
  const existing = await expenseRepository.findById(supabase, id, userId);
  if (!existing) {
    return error("Expense not found", "NOT_FOUND");
  }

  // 5. Execute update
  try {
    const expense = await expenseRepository.update(
      supabase,
      id,
      userId,
      validation.data
    );

    revalidatePath("/");
    revalidatePath("/analytics");

    return success(expense);
  } catch (err) {
    console.error("Failed to update expense:", err);
    return error("Failed to update expense", "DATABASE_ERROR");
  }
}

/**
 * Update expense from data object (for programmatic use)
 */
export async function updateExpenseFromData(
  id: string,
  data: {
    category?: string | null;
    bucket_id?: string | null;
    amount?: number;
    label?: string;
    notes?: string | null;
  }
): Promise<ActionResult<Expense>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  // Validate ID
  const idValidation = expenseIdSchema.safeParse({ id });
  if (!idValidation.success) {
    return error("Invalid expense ID", "VALIDATION_ERROR");
  }

  // Check if expense exists
  const existing = await expenseRepository.findById(supabase, id, userId);
  if (!existing) {
    return error("Expense not found", "NOT_FOUND");
  }

  try {
    const expense = await expenseRepository.update(supabase, id, userId, data);

    revalidatePath("/");
    revalidatePath("/analytics");

    return success(expense);
  } catch (err) {
    console.error("Failed to update expense:", err);
    return error("Failed to update expense", "DATABASE_ERROR");
  }
}
