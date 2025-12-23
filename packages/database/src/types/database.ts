/**
 * usemargin Database Types
 *
 * Manually maintained types that match our Supabase schema.
 * Keep in sync with migrations in /migrations folder.
 */

// --- Core Types ---

export interface Expense {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  label: string;
  category: string | null;
  created_at: string;
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
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  day_of_month: number; // 1-31
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  due_date: number; // Day of month 1-31
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_daily_limit: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// --- Insert Types (for creating new records) ---

export type ExpenseInsert = Omit<Expense, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type DailyOverrideInsert = Omit<DailyOverride, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type FlexBucketInsert = Omit<FlexBucket, "id" | "updated_at"> & {
  id?: string;
  updated_at?: string;
};

export type FlexAllocationInsert = Omit<FlexAllocation, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type IncomeInsert = Omit<Income, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type DebtInsert = Omit<Debt, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type UserSettingsInsert = Omit<UserSettings, "id" | "created_at" | "updated_at"> & {
  id?: string;
  default_daily_limit?: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
};

// --- Update Types (for updating records) ---

export type ExpenseUpdate = Partial<Omit<Expense, "id" | "user_id">>;
export type DailyOverrideUpdate = Partial<Omit<DailyOverride, "id" | "user_id">>;
export type FlexBucketUpdate = Partial<Omit<FlexBucket, "id" | "user_id">>;
export type FlexAllocationUpdate = Partial<Omit<FlexAllocation, "id" | "user_id">>;
export type IncomeUpdate = Partial<Omit<Income, "id" | "user_id">>;
export type DebtUpdate = Partial<Omit<Debt, "id" | "user_id">>;
export type UserSettingsUpdate = Partial<Omit<UserSettings, "id" | "user_id">>;
