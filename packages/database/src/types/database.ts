/**
 * usemargin Database Types
 *
 * Manually maintained types that match our Supabase schema.
 * Keep in sync with migrations in /migrations folder.
 */

// =============================================================================
// ENUMS
// =============================================================================

export type IncomeFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "once";

export type IncomeStatus = "pending" | "expected" | "received";

export type BillFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly"
  | "once";

export type BillStatus = "pending" | "paid" | "overdue" | "partially_paid";

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type AssetType =
  | "cash"
  | "investment"
  | "property"
  | "vehicle"
  | "crypto"
  | "retirement"
  | "other";

export type LiabilityType =
  | "credit_card"
  | "personal_loan"
  | "auto_loan"
  | "mortgage"
  | "student_loan"
  | "other";

export type SavingsTransactionType =
  | "contribution"
  | "withdrawal"
  | "interest"
  | "adjustment";

// =============================================================================
// CORE TYPES (Updated)
// =============================================================================

export interface Expense {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  label: string;
  category: string | null;
  category_id: string | null;
  notes: string | null;
  time_of_day: string | null; // HH:MM:SS
  recurring_expense_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyOverride {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  limit_amount: number;
  created_at: string;
}

export interface FlexBucket {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface FlexAllocation {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  day_of_month: number | null; // 1-31, nullable for non-monthly frequencies
  frequency: IncomeFrequency;
  day_of_week: number | null; // 0-6 (Sunday-Saturday)
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  expected_date: string | null;
  received_date: string | null;
  status: IncomeStatus;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  label: string;
  amount: number; // Payment amount per period
  due_date: number | null; // Day of month 1-31, nullable for non-monthly
  icon: string | null;
  total_amount: number | null; // Original debt amount
  remaining_balance: number | null;
  interest_rate: number | null; // APR as decimal (e.g., 0.1299 for 12.99%)
  minimum_payment: number | null;
  frequency: BillFrequency;
  day_of_week: number | null;
  start_date: string | null;
  end_date: string | null;
  is_recurring: boolean;
  status: BillStatus;
  paid_date: string | null;
  receive_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_daily_limit: number;
  currency: string;
  timezone: string;
  week_starts_on: number; // 0-6 (Sunday-Saturday)
  show_savings_in_allocation: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// NEW TYPES
// =============================================================================

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  category_id: string | null;
  category: string | null;
  notes: string | null;
  icon: string | null;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
  auto_log: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shortcut {
  id: string;
  user_id: string;
  trigger: string; // Without @ prefix
  label: string;
  category_id: string | null;
  category: string | null;
  icon: string | null;
  default_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_balance: number;
  icon: string | null;
  color: string | null;
  target_date: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  user_id: string;
  savings_goal_id: string;
  amount: number; // Positive = contribution, negative = withdrawal
  type: SavingsTransactionType;
  notes: string | null;
  date: string;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  balance: number;
  institution: string | null;
  account_number: string | null;
  notes: string | null;
  is_liquid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  institution: string | null;
  account_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  created_at: string;
}

// =============================================================================
// INSERT TYPES (for creating new records)
// =============================================================================

export type ExpenseInsert = Omit<Expense, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type DailyOverrideInsert = Omit<DailyOverride, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type FlexBucketInsert = Omit<FlexBucket, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

export type FlexAllocationInsert = Omit<FlexAllocation, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type IncomeInsert = Omit<Income, "id" | "created_at" | "updated_at"> & {
  id?: string;
  frequency?: IncomeFrequency;
  is_active?: boolean;
  status?: IncomeStatus;
  created_at?: string;
  updated_at?: string;
};

export type DebtInsert = Omit<Debt, "id" | "created_at" | "updated_at"> & {
  id?: string;
  frequency?: BillFrequency;
  is_recurring?: boolean;
  status?: BillStatus;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserSettingsInsert = Omit<UserSettings, "id" | "created_at" | "updated_at"> & {
  id?: string;
  default_daily_limit?: number;
  currency?: string;
  timezone?: string;
  week_starts_on?: number;
  show_savings_in_allocation?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryInsert = Omit<Category, "id" | "created_at" | "updated_at"> & {
  id?: string;
  is_system?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export type RecurringExpenseInsert = Omit<RecurringExpense, "id" | "created_at" | "updated_at"> & {
  id?: string;
  frequency?: RecurringFrequency;
  is_active?: boolean;
  auto_log?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ShortcutInsert = Omit<Shortcut, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SavingsGoalInsert = Omit<SavingsGoal, "id" | "created_at" | "updated_at"> & {
  id?: string;
  current_balance?: number;
  is_hidden?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type SavingsTransactionInsert = Omit<SavingsTransaction, "id" | "created_at"> & {
  id?: string;
  date?: string;
  created_at?: string;
};

export type AssetInsert = Omit<Asset, "id" | "created_at" | "updated_at"> & {
  id?: string;
  balance?: number;
  is_liquid?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LiabilityInsert = Omit<Liability, "id" | "created_at" | "updated_at"> & {
  id?: string;
  balance?: number;
  created_at?: string;
  updated_at?: string;
};

export type NetWorthSnapshotInsert = Omit<NetWorthSnapshot, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// =============================================================================
// UPDATE TYPES (for updating records)
// =============================================================================

export type ExpenseUpdate = Partial<Omit<Expense, "id" | "user_id">>;
export type DailyOverrideUpdate = Partial<Omit<DailyOverride, "id" | "user_id">>;
export type FlexBucketUpdate = Partial<Omit<FlexBucket, "id" | "user_id">>;
export type FlexAllocationUpdate = Partial<Omit<FlexAllocation, "id" | "user_id">>;
export type IncomeUpdate = Partial<Omit<Income, "id" | "user_id">>;
export type DebtUpdate = Partial<Omit<Debt, "id" | "user_id">>;
export type UserSettingsUpdate = Partial<Omit<UserSettings, "id" | "user_id">>;
export type CategoryUpdate = Partial<Omit<Category, "id" | "user_id">>;
export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, "id" | "user_id">>;
export type ShortcutUpdate = Partial<Omit<Shortcut, "id" | "user_id">>;
export type SavingsGoalUpdate = Partial<Omit<SavingsGoal, "id" | "user_id">>;
export type AssetUpdate = Partial<Omit<Asset, "id" | "user_id">>;
export type LiabilityUpdate = Partial<Omit<Liability, "id" | "user_id">>;
