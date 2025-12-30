"use server";

import { revalidatePath } from "next/cache";
import { createIncomeSchema, type CreateIncomeInput } from "@/lib/validations/income.schema";
import { incomeRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Income } from "@repo/database";

export async function createIncome(
  data: CreateIncomeInput
): Promise<ActionResult<Income>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createIncomeSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const income = await incomeRepository.create(supabase, {
      user_id: userId,
      label: validation.data.label,
      amount: validation.data.amount,
      day_of_month: validation.data.day_of_month ?? null,
      frequency: validation.data.frequency,
      day_of_week: validation.data.day_of_week ?? null,
      start_date: validation.data.start_date ?? null,
      end_date: validation.data.end_date ?? null,
      expected_date: validation.data.expected_date ?? null,
      is_active: validation.data.is_active,
      status: "expected",
      received_date: null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(income);
  } catch (err) {
    console.error("Failed to create income:", err);
    return error("Failed to create income", "DATABASE_ERROR");
  }
}
