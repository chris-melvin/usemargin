import { z } from "zod";

const frequencyEnum = z.enum(["weekly", "biweekly", "monthly", "yearly", "once"]);
const statusEnum = z.enum(["pending", "paid", "overdue", "partially_paid"]);

/**
 * Schema for creating a bill/debt
 */
export const createBillSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(255, "Label must be 255 characters or less"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  due_date: z.coerce.number().int().min(1).max(31).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  total_amount: z.coerce.number().positive().max(999999999.99).optional().nullable(),
  remaining_balance: z.coerce.number().min(0).max(999999999.99).optional().nullable(),
  interest_rate: z.coerce.number().min(0).max(1).optional().nullable(), // APR as decimal
  minimum_payment: z.coerce.number().positive().max(999999999.99).optional().nullable(),
  frequency: frequencyEnum.default("monthly"),
  day_of_week: z.coerce.number().int().min(0).max(6).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_recurring: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

/**
 * Schema for updating a bill
 */
export const updateBillSchema = createBillSchema.partial().extend({
  status: statusEnum.optional(),
  paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

/**
 * Schema for marking a bill as paid
 */
export const markBillPaidSchema = z.object({
  id: z.string().uuid("Invalid bill ID"),
  paid_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
});

// Export inferred types
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type MarkBillPaidInput = z.infer<typeof markBillPaidSchema>;
export type BillFrequency = z.infer<typeof frequencyEnum>;
export type BillStatus = z.infer<typeof statusEnum>;
