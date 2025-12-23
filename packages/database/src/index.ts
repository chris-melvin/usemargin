// Core entity types
export type {
  Expense,
  DailyOverride,
  FlexBucket,
  FlexAllocation,
  Income,
  Debt,
  UserSettings,
} from "./types/database.js";

// Insert types (for creating records)
export type {
  ExpenseInsert,
  DailyOverrideInsert,
  FlexBucketInsert,
  FlexAllocationInsert,
  IncomeInsert,
  DebtInsert,
  UserSettingsInsert,
} from "./types/database.js";

// Update types (for updating records)
export type {
  ExpenseUpdate,
  DailyOverrideUpdate,
  FlexBucketUpdate,
  FlexAllocationUpdate,
  IncomeUpdate,
  DebtUpdate,
  UserSettingsUpdate,
} from "./types/database.js";
