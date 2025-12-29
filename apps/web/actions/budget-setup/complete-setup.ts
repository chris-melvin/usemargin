"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WizardIncome, WizardBill, WizardBucket } from "@/lib/budget-setup";

interface CompleteBudgetSetupParams {
  incomes: WizardIncome[];
  bills: WizardBill[];
  buckets: WizardBucket[];
  dailyLimit: number;
  totalMonthlyIncome: number;
  totalFixedExpenses: number;
}

/**
 * Complete budget setup atomically
 * Uses PostgreSQL function to ensure all operations succeed or all fail
 * This prevents partial setup states where some data is saved but not all
 */
export async function completeBudgetSetup(params: CompleteBudgetSetupParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { incomes, bills, buckets, dailyLimit, totalMonthlyIncome, totalFixedExpenses } = params;

  // Convert to JSONB format for PostgreSQL function
  const incomesJson = incomes.map((income) => ({
    label: income.label,
    amount: income.amount,
    frequency: income.frequency,
    dayOfMonth: income.dayOfMonth ?? null,
  }));

  const billsJson = bills.map((bill) => ({
    label: bill.label,
    amount: bill.amount,
    frequency: bill.frequency,
    dueDate: bill.dueDate ?? null,
  }));

  const bucketsJson = buckets.map((bucket) => ({
    name: bucket.name,
    slug: bucket.slug,
    percentage: bucket.percentage,
    allocatedAmount: bucket.allocatedAmount,
    color: bucket.color,
    icon: bucket.icon,
    isDefault: bucket.isDefault,
    isSystem: bucket.isSystem,
  }));

  try {
    // Use atomic RPC function to ensure all operations succeed or all fail
    const { data, error } = await supabase.rpc("complete_budget_setup", {
      p_user_id: user.id,
      p_incomes: incomesJson,
      p_bills: billsJson,
      p_buckets: bucketsJson,
      p_daily_limit: dailyLimit,
      p_total_monthly_income: totalMonthlyIncome,
      p_total_fixed_expenses: totalFixedExpenses,
    });

    if (error) {
      console.error("Failed to complete budget setup atomically:", error);
      throw error;
    }

    // Revalidate the main page
    revalidatePath("/");

    return { success: true, ...data };
  } catch (error) {
    console.error("Failed to complete budget setup:", error);
    throw error;
  }
}
