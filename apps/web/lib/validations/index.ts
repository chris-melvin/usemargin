// Auth schemas
export {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  newPasswordSchema,
  type SignInInput,
  type SignUpInput,
  type ResetPasswordInput,
  type NewPasswordInput,
} from "./auth.schema";

// Expense schemas
export {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
  expenseMonthQuerySchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQuery,
  type ExpenseMonthQuery,
} from "./expense.schema";

// Settings schemas
export {
  updateSettingsSchema,
  createSettingsSchema,
  type UpdateSettingsInput,
  type CreateSettingsInput,
} from "./settings.schema";

// Bill schemas
export {
  createBillSchema,
  updateBillSchema,
  markBillPaidSchema,
  type CreateBillInput,
  type UpdateBillInput,
  type MarkBillPaidInput,
  type BillFrequency,
  type BillStatus,
} from "./bill.schema";

// Income schemas
export {
  createIncomeSchema,
  updateIncomeSchema,
  markIncomeReceivedSchema,
  type CreateIncomeInput,
  type UpdateIncomeInput,
  type MarkIncomeReceivedInput,
  type IncomeFrequency,
  type IncomeStatus,
} from "./income.schema";

// Flex bucket schemas
export {
  updateFlexBucketSchema,
  createFlexAllocationSchema,
  updateFlexAllocationSchema,
  createDailyOverrideSchema,
  updateDailyOverrideSchema,
  type UpdateFlexBucketInput,
  type CreateFlexAllocationInput,
  type UpdateFlexAllocationInput,
  type CreateDailyOverrideInput,
  type UpdateDailyOverrideInput,
} from "./flex-bucket.schema";
