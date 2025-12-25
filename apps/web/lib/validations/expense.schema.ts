import { z } from "zod";

/**
 * Schema for creating a new expense
 */
export const createExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  label: z
    .string()
    .min(1, "Label is required")
    .max(255, "Label must be 255 characters or less"),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  time_of_day: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format (HH:MM or HH:MM:SS)")
    .optional()
    .nullable(),
});

/**
 * Schema for updating an expense (all fields optional)
 */
export const updateExpenseSchema = createExpenseSchema.partial();

/**
 * Schema for expense ID parameter
 */
export const expenseIdSchema = z.object({
  id: z.string().uuid("Invalid expense ID"),
});

/**
 * Schema for querying expenses by date range
 */
export const expenseQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
});

/**
 * Schema for querying expenses by month
 */
export const expenseMonthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(0).max(11), // 0-indexed like JS Date
});

// Export inferred types
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export type ExpenseMonthQuery = z.infer<typeof expenseMonthQuerySchema>;
