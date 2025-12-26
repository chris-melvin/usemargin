// Enum types
export type {
  IncomeFrequency,
  IncomeStatus,
  BillFrequency,
  BillStatus,
  RecurringFrequency,
  AssetType,
  LiabilityType,
  SavingsTransactionType,
} from "./types/database.js";

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

// New entity types
export type {
  Category,
  RecurringExpense,
  Shortcut,
  SavingsGoal,
  SavingsTransaction,
  Asset,
  Liability,
  NetWorthSnapshot,
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
  CategoryInsert,
  RecurringExpenseInsert,
  ShortcutInsert,
  SavingsGoalInsert,
  SavingsTransactionInsert,
  AssetInsert,
  LiabilityInsert,
  NetWorthSnapshotInsert,
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
  CategoryUpdate,
  RecurringExpenseUpdate,
  ShortcutUpdate,
  SavingsGoalUpdate,
  AssetUpdate,
  LiabilityUpdate,
} from "./types/database.js";

// Onboarding types
export type {
  ProgressiveHintState,
  UserOnboarding,
  UserOnboardingInsert,
  UserOnboardingUpdate,
} from "./types/database.js";

// Budget bucket types
export type {
  BucketMatchType,
  BudgetBucket,
  ExpenseBucketRule,
  BudgetBucketInsert,
  BudgetBucketUpdate,
  ExpenseBucketRuleInsert,
  ExpenseBucketRuleUpdate,
} from "./types/database.js";
