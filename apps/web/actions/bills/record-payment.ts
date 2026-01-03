"use server";

import { revalidatePath } from "next/cache";
import { recordDebtPaymentSchema } from "@/lib/validations/bill.schema";
import { billRepository, debtPaymentRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { DebtPayment, Debt } from "@repo/database";
import { calculatePeriod } from "@/lib/utils/debt-period";

interface RecordPaymentResult {
  payment: DebtPayment;
  debt: Debt;
}

/**
 * Record a debt payment and update the debt balance
 * This creates a payment history record and updates the debt's remaining balance
 */
export async function recordDebtPayment(
  data: { debt_id: string; amount: number; payment_date?: string; notes?: string }
): Promise<ActionResult<RecordPaymentResult>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const paymentDate = data.payment_date ?? new Date().toISOString().slice(0, 10);

  // Validate input
  const validation = recordDebtPaymentSchema.safeParse({
    ...data,
    payment_date: paymentDate,
  });
  if (!validation.success) {
    return error(validation.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
  }

  try {
    // Get the debt to determine period and current balance
    const debt = await billRepository.findById(supabase, data.debt_id, userId);
    if (!debt) {
      return error("Debt not found", "NOT_FOUND");
    }

    // Calculate billing period based on frequency
    const { periodStart, periodEnd } = calculatePeriod(
      paymentDate,
      debt.frequency,
      debt.start_date
    );

    // Create payment record
    const payment = await debtPaymentRepository.create(supabase, {
      user_id: userId,
      debt_id: data.debt_id,
      amount: validation.data.amount,
      payment_date: paymentDate,
      period_start: periodStart,
      period_end: periodEnd,
      notes: data.notes ?? null,
    });

    // Update debt balance
    const currentBalance = debt.remaining_balance ?? debt.total_amount ?? 0;
    const newBalance = Math.max(0, currentBalance - validation.data.amount);

    const updatedDebt = await billRepository.update(supabase, data.debt_id, userId, {
      remaining_balance: newBalance,
      status: "paid",
      paid_date: paymentDate,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budget");

    return success({ payment, debt: updatedDebt });
  } catch (err) {
    console.error("Failed to record debt payment:", err);
    return error("Failed to record payment", "DATABASE_ERROR");
  }
}

/**
 * Get payment history for a debt
 */
export async function getDebtPaymentHistory(
  debtId: string
): Promise<ActionResult<DebtPayment[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const payments = await debtPaymentRepository.findByDebtId(supabase, debtId, userId);
    return success(payments);
  } catch (err) {
    console.error("Failed to get payment history:", err);
    return error("Failed to get payment history", "DATABASE_ERROR");
  }
}

/**
 * Get payment stats for a debt (average, min, max, count)
 */
export async function getDebtPaymentStats(
  debtId: string
): Promise<ActionResult<{ avg: number; min: number; max: number; count: number; total: number }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const stats = await debtPaymentRepository.getPaymentStats(supabase, debtId, userId);
    return success(stats);
  } catch (err) {
    console.error("Failed to get payment stats:", err);
    return error("Failed to get payment stats", "DATABASE_ERROR");
  }
}
