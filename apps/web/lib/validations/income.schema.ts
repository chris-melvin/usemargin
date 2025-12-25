import { z } from "zod";

const frequencyEnum = z.enum([
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
  "once",
]);
const statusEnum = z.enum(["pending", "expected", "received"]);

/**
 * Schema for creating an income
 */
export const createIncomeSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(255, "Label must be 255 characters or less"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  day_of_month: z.coerce.number().int().min(1).max(31).optional().nullable(),
  frequency: frequencyEnum.default("monthly"),
  day_of_week: z.coerce.number().int().min(0).max(6).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expected_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_active: z.boolean().default(true),
});

/**
 * Schema for updating an income
 */
export const updateIncomeSchema = createIncomeSchema.partial().extend({
  status: statusEnum.optional(),
  received_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

/**
 * Schema for marking income as received
 */
export const markIncomeReceivedSchema = z.object({
  id: z.string().uuid("Invalid income ID"),
  received_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  actual_amount: z.coerce.number().positive().optional(),
});

// Export inferred types
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type MarkIncomeReceivedInput = z.infer<typeof markIncomeReceivedSchema>;
export type IncomeFrequency = z.infer<typeof frequencyEnum>;
export type IncomeStatus = z.infer<typeof statusEnum>;
