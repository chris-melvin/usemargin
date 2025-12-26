"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WizardIncome, WizardBill, WizardBucket } from "@/lib/budget-setup";
import { budgetBucketRepository } from "@/lib/repositories";
import type { IncomeInsert, DebtInsert, BudgetBucketInsert } from "@repo/database";

interface CompleteBudgetSetupParams {
  incomes: WizardIncome[];
  bills: WizardBill[];
  buckets: WizardBucket[];
  dailyLimit: number;
  totalMonthlyIncome: number;
  totalFixedExpenses: number;
}

export async function completeBudgetSetup(params: CompleteBudgetSetupParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { incomes, bills, buckets, dailyLimit, totalMonthlyIncome, totalFixedExpenses } = params;

  try {
    // 1. Save incomes
    if (incomes.length > 0) {
      const incomeInserts: IncomeInsert[] = incomes.map((income) => ({
        user_id: user.id,
        label: income.label,
        amount: income.amount,
        frequency: income.frequency,
        day_of_month: income.dayOfMonth ?? null,
        is_active: true,
        status: "expected" as const,
        day_of_week: null,
        start_date: null,
        end_date: null,
        expected_date: null,
        received_date: null,
      }));

      const { error: incomeError } = await supabase
        .from("incomes")
        .insert(incomeInserts);

      if (incomeError) {
        console.error("Error saving incomes:", incomeError);
        throw incomeError;
      }
    }

    // 2. Save bills (as debts)
    if (bills.length > 0) {
      const billInserts: DebtInsert[] = bills.map((bill) => ({
        user_id: user.id,
        label: bill.label,
        amount: bill.amount,
        frequency: bill.frequency,
        due_date: bill.dueDate ?? null,
        is_active: true,
        is_recurring: true,
        status: "pending" as const,
        icon: null,
        total_amount: null,
        remaining_balance: null,
        interest_rate: null,
        minimum_payment: null,
        day_of_week: null,
        start_date: null,
        end_date: null,
        paid_date: null,
        receive_date: null,
      }));

      const { error: billError } = await supabase.from("debts").insert(billInserts);

      if (billError) {
        console.error("Error saving bills:", billError);
        throw billError;
      }
    }

    // 3. Save buckets
    const bucketInserts: BudgetBucketInsert[] = buckets.map((bucket, index) => ({
      user_id: user.id,
      name: bucket.name,
      slug: bucket.slug,
      percentage: bucket.percentage,
      allocated_amount: bucket.allocatedAmount,
      color: bucket.color,
      icon: bucket.icon,
      is_default: bucket.isDefault,
      is_system: bucket.isSystem,
      sort_order: index,
    }));

    const { error: bucketError } = await supabase
      .from("budget_buckets")
      .insert(bucketInserts);

    if (bucketError) {
      console.error("Error saving buckets:", bucketError);
      throw bucketError;
    }

    // 4. Update user settings
    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        default_daily_limit: dailyLimit,
        budget_setup_completed: true,
        total_monthly_income: totalMonthlyIncome,
        total_fixed_expenses: totalFixedExpenses,
        calculated_daily_limit: dailyLimit,
      }, {
        onConflict: "user_id",
      });

    if (settingsError) {
      console.error("Error updating settings:", settingsError);
      throw settingsError;
    }

    // 5. Update onboarding state
    const { error: onboardingError } = await supabase
      .from("user_onboarding")
      .upsert({
        user_id: user.id,
        budget_setup_completed: true,
        budget_setup_step: 4, // Completed all steps
      }, {
        onConflict: "user_id",
      });

    if (onboardingError) {
      console.error("Error updating onboarding:", onboardingError);
      // Non-critical, don't throw
    }

    // Revalidate the main page
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to complete budget setup:", error);
    throw error;
  }
}
