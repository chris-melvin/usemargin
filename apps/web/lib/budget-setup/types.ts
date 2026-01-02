import type { IncomeFrequency, BillFrequency } from "@repo/database";

/**
 * Budget setup wizard types
 */

export interface WizardIncome {
  id: string;
  label: string;
  amount: number;
  frequency: IncomeFrequency;
  dayOfMonth?: number;
  isPrimary: boolean;
}

export interface WizardBill {
  id: string;
  label: string;
  amount: number;
  frequency: BillFrequency;
  dueDate?: number;
  category: BillCategory;
}

export type BillCategory =
  | "housing"
  | "utilities"
  | "subscriptions"
  | "loans"
  | "insurance"
  | "other";

export interface WizardBucket {
  id: string;
  name: string;
  slug: string;
  percentage: number | null; // Percentage of remaining budget (0-100), null for fixed-amount buckets
  targetAmount: number | null; // Fixed monthly amount, alternative to percentage
  allocatedAmount: number;
  color: string;
  icon: string;
  description?: string; // User-facing description for tooltips
  isDefault: boolean;
  isSystem: boolean;
}

/**
 * Suggested bucket templates for the setup wizard
 * These are suggestions, not defaults - users create their own buckets
 */
export interface BucketSuggestion {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  suggestedPercentage?: number; // Optional hint for percentage
}

export interface BudgetSetupState {
  step: number;
  incomes: WizardIncome[];
  bills: WizardBill[];
  buckets: WizardBucket[];
  monthlyIncome: number;
  monthlyExpenses: number;
  availableForBudget: number;
  dailyLimit: number;
  dailyLimitOverride: number | null;
}

export interface BudgetSummary {
  totalMonthlyIncome: number;
  totalFixedExpenses: number;
  availableForBudgeting: number;
  savingsAmount: number;
  dailySpendingAmount: number;
  calculatedDailyLimit: number;
  daysInMonth: number;
}

export const WIZARD_STEPS = [
  { id: 1, title: "Income", description: "Set up your income sources" },
  { id: 2, title: "Bills", description: "Add your fixed expenses" },
  { id: 3, title: "Buckets", description: "Allocate your budget" },
  { id: 4, title: "Summary", description: "Review and confirm" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

/**
 * Simplified debt type for setup wizard
 */
export interface WizardDebt {
  id: string;
  label: string;
  monthlyPayment: number;
  dueDate?: number;
  totalBalance?: number;
  interestRate?: number;
  monthsRemaining?: number;
  icon: string;
}
