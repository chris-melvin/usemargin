"use server";

import { revalidatePath } from "next/cache";
import { billRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Debt } from "@repo/database";

export async function markBillPaid(
  id: string,
  paidDate?: string
): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const bill = await billRepository.markAsPaid(supabase, id, userId, paidDate);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to mark bill as paid:", err);
    return error("Failed to mark bill as paid", "DATABASE_ERROR");
  }
}

export async function resetBillStatus(id: string): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const bill = await billRepository.resetStatus(supabase, id, userId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to reset bill status:", err);
    return error("Failed to reset bill status", "DATABASE_ERROR");
  }
}

/**
 * Update debt balance after payment
 */
export async function makeDebtPayment(
  id: string,
  paymentAmount: number,
  paidDate?: string
): Promise<ActionResult<Debt>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    // Get current bill to calculate new balance
    const current = await billRepository.findById(supabase, id, userId);
    if (!current) {
      return error("Bill not found", "NOT_FOUND");
    }

    const currentBalance = current.remaining_balance ?? current.total_amount ?? 0;
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    const bill = await billRepository.update(supabase, id, userId, {
      remaining_balance: newBalance,
      status: "paid",
      paid_date: paidDate ?? new Date().toISOString().split("T")[0],
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success(bill);
  } catch (err) {
    console.error("Failed to make debt payment:", err);
    return error("Failed to make debt payment", "DATABASE_ERROR");
  }
}
