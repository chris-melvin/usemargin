import type { IncomeFrequency, BillFrequency } from "@repo/database";
import type { WizardIncome, WizardBill, WizardBucket, BudgetSummary } from "./types";

/**
 * Normalize any frequency to monthly amount
 */
export function normalizeToMonthly(
  amount: number,
  frequency: IncomeFrequency | BillFrequency
): number {
  switch (frequency) {
    case "weekly":
      return amount * 4.33; // Average weeks per month
    case "biweekly":
      return amount * 2.17; // Average bi-weeks per month
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    case "once":
      return 0; // One-time doesn't affect monthly budget
    default:
      return amount;
  }
}

/**
 * Calculate total monthly income from all sources
 */
export function calculateTotalMonthlyIncome(incomes: WizardIncome[]): number {
  return incomes.reduce((sum, income) => {
    return sum + normalizeToMonthly(income.amount, income.frequency);
  }, 0);
}

/**
 * Calculate total monthly fixed expenses
 */
export function calculateTotalMonthlyExpenses(bills: WizardBill[]): number {
  return bills.reduce((sum, bill) => {
    return sum + normalizeToMonthly(bill.amount, bill.frequency);
  }, 0);
}

/**
 * Calculate available amount for budgeting
 */
export function calculateAvailableForBudget(
  totalIncome: number,
  totalExpenses: number
): number {
  return Math.max(0, totalIncome - totalExpenses);
}

/**
 * Calculate bucket allocated amounts based on percentages or target amounts
 */
export function calculateBucketAllocations(
  buckets: WizardBucket[],
  availableAmount: number
): WizardBucket[] {
  // First pass: calculate fixed amounts (target_amount buckets)
  let fixedTotal = 0;
  const fixedBuckets = buckets.filter((b) => b.targetAmount != null && b.targetAmount > 0);
  for (const bucket of fixedBuckets) {
    fixedTotal += bucket.targetAmount!;
  }

  // Remaining budget for percentage-based buckets
  const remainingAfterFixed = Math.max(0, availableAmount - fixedTotal);

  return buckets.map((bucket) => {
    if (bucket.targetAmount != null && bucket.targetAmount > 0) {
      // Fixed amount bucket
      return {
        ...bucket,
        allocatedAmount: Math.min(bucket.targetAmount, availableAmount),
      };
    } else {
      // Percentage-based bucket
      return {
        ...bucket,
        allocatedAmount: Math.floor((remainingAfterFixed * (bucket.percentage ?? 0)) / 100),
      };
    }
  });
}

/**
 * Calculate daily spending limit from the daily spending bucket
 */
export function calculateDailyLimit(
  buckets: WizardBucket[],
  availableAmount: number,
  daysInMonth: number = 30
): number {
  // Find the default bucket (daily spending)
  const dailySpendingBucket = buckets.find((b) => b.isDefault);

  if (!dailySpendingBucket) {
    // Fallback: use the largest bucket or 50% of available
    return Math.floor((availableAmount * 0.5) / daysInMonth);
  }

  // Support both target amount and percentage
  let monthlyDailySpending: number;
  if (dailySpendingBucket.targetAmount != null && dailySpendingBucket.targetAmount > 0) {
    monthlyDailySpending = dailySpendingBucket.targetAmount;
  } else {
    monthlyDailySpending = (availableAmount * (dailySpendingBucket.percentage ?? 0)) / 100;
  }

  return Math.floor(monthlyDailySpending / daysInMonth);
}

/**
 * Get the number of days in the current month
 */
export function getDaysInCurrentMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

/**
 * Get the number of days remaining in the current month
 */
export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const daysInMonth = getDaysInCurrentMonth();
  return daysInMonth - now.getDate() + 1;
}

/**
 * Calculate full budget summary
 */
export function calculateBudgetSummary(
  incomes: WizardIncome[],
  bills: WizardBill[],
  buckets: WizardBucket[]
): BudgetSummary {
  const daysInMonth = getDaysInCurrentMonth();
  const totalMonthlyIncome = calculateTotalMonthlyIncome(incomes);
  const totalFixedExpenses = calculateTotalMonthlyExpenses(bills);
  const availableForBudgeting = calculateAvailableForBudget(
    totalMonthlyIncome,
    totalFixedExpenses
  );

  // Calculate bucket amounts (support both percentage and target amount)
  const savingsBucket = buckets.find((b) => b.slug === "savings");
  const dailySpendingBucket = buckets.find((b) => b.isDefault);

  let savingsAmount = 0;
  if (savingsBucket) {
    if (savingsBucket.targetAmount != null && savingsBucket.targetAmount > 0) {
      savingsAmount = savingsBucket.targetAmount;
    } else {
      savingsAmount = Math.floor((availableForBudgeting * (savingsBucket.percentage ?? 0)) / 100);
    }
  }

  let dailySpendingAmount = availableForBudgeting;
  if (dailySpendingBucket) {
    if (dailySpendingBucket.targetAmount != null && dailySpendingBucket.targetAmount > 0) {
      dailySpendingAmount = dailySpendingBucket.targetAmount;
    } else {
      dailySpendingAmount = Math.floor((availableForBudgeting * (dailySpendingBucket.percentage ?? 0)) / 100);
    }
  }

  const calculatedDailyLimit = Math.floor(dailySpendingAmount / daysInMonth);

  return {
    totalMonthlyIncome,
    totalFixedExpenses,
    availableForBudgeting,
    savingsAmount,
    dailySpendingAmount,
    calculatedDailyLimit,
    daysInMonth,
  };
}

/**
 * Validate bucket percentages sum to 100
 * Note: Buckets with targetAmount are not counted in percentage validation
 */
export function validateBucketPercentages(buckets: WizardBucket[]): {
  isValid: boolean;
  total: number;
  message: string;
} {
  // Only count percentage-based buckets
  const percentageBuckets = buckets.filter(
    (b) => b.targetAmount == null || b.targetAmount === 0
  );
  const hasFixedBuckets = buckets.some(
    (b) => b.targetAmount != null && b.targetAmount > 0
  );

  const total = percentageBuckets.reduce((sum, b) => sum + (b.percentage ?? 0), 0);

  // If there are fixed-amount buckets, percentage doesn't need to be exactly 100
  if (hasFixedBuckets) {
    // Just ensure we have some allocation
    const isValid = buckets.length > 0;
    return {
      isValid,
      total,
      message: isValid ? "Allocation complete" : "Add at least one bucket",
    };
  }

  const isValid = Math.abs(total - 100) < 0.01; // Allow for floating point errors

  return {
    isValid,
    total,
    message: isValid
      ? "Allocation complete"
      : total < 100
        ? `${(100 - total).toFixed(1)}% remaining`
        : `${(total - 100).toFixed(1)}% over allocated`,
  };
}

/**
 * Generate a slug from a bucket name
 */
export function generateBucketSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
