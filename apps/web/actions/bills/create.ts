"use server";

import { revalidatePath } from "next/cache";
import { createBillSchema, type CreateBillInput } from "@/lib/validations/bill.schema";
import { billRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Debt } from "@repo/database";

export async function createBill(
  data: CreateBillInput
): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = createBillSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const bill = await billRepository.create(supabase, {
      user_id: userId,
      label: validation.data.label,
      amount: validation.data.amount,
      due_date: validation.data.due_date ?? null,
      icon: validation.data.icon ?? null,
      total_amount: validation.data.total_amount ?? null,
      remaining_balance: validation.data.remaining_balance ?? null,
      interest_rate: validation.data.interest_rate ?? null,
      minimum_payment: validation.data.minimum_payment ?? null,
      payment_type: validation.data.payment_type ?? "fixed",
      payment_mode: validation.data.payment_mode ?? "manual",
      payment_bucket_id: validation.data.payment_bucket_id ?? null,
      frequency: validation.data.frequency,
      day_of_week: validation.data.day_of_week ?? null,
      start_date: validation.data.start_date ?? null,
      end_date: validation.data.end_date ?? null,
      is_recurring: validation.data.is_recurring,
      is_active: validation.data.is_active,
      status: "pending",
      paid_date: null,
      receive_date: null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to create bill:", err);
    return error("Failed to create bill", "DATABASE_ERROR");
  }
}
