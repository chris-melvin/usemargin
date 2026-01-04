import { z } from "zod";

const frequencyEnum = z.enum(["weekly", "biweekly", "monthly", "yearly", "once"]);
const statusEnum = z.enum(["pending", "paid", "overdue", "partially_paid"]);
const paymentTypeEnum = z.enum(["fixed", "variable"]);
const paymentModeEnum = z.enum(["manual", "auto_deduct"]);

/**
 * Schema for creating a bill/debt
 */
// Helper to coerce empty strings to null for optional number fields
const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.coerce.number().positive().max(999999999.99).optional().nullable()
);

const optionalNumberOrZero = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.coerce.number().min(0).max(999999999.99).optional().nullable()
);

const optionalRate = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.coerce.number().min(0).max(1).optional().nullable()
);

export const createBillSchema = z.object({
  label: z
    .string()
    .min(1, "Label is required")
    .max(255, "Label must be 255 characters or less"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  due_date: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.coerce.number().int().min(1).max(31).optional().nullable()
  ),
  icon: z.string().max(10).optional().nullable(),
  total_amount: optionalNumber,
  remaining_balance: optionalNumberOrZero,
  interest_rate: optionalRate, // APR as decimal
  minimum_payment: optionalNumber,
  frequency: frequencyEnum.default("monthly"),
  payment_type: paymentTypeEnum.optional().default("fixed"),
  day_of_week: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.coerce.number().int().min(0).max(6).optional().nullable()
  ),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  is_recurring: z.boolean().default(true),
  is_active: z.boolean().default(true),
  payment_mode: paymentModeEnum.default("manual"),
  payment_bucket_id: z.string().uuid().optional().nullable(),
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

/**
 * Schema for recording a debt payment (for payment history)
 */
export const recordDebtPaymentSchema = z.object({
  debt_id: z.string().uuid("Invalid debt ID"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  notes: z.string().max(500).optional().nullable(),
});

// Export inferred types
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type MarkBillPaidInput = z.infer<typeof markBillPaidSchema>;
export type RecordDebtPaymentInput = z.infer<typeof recordDebtPaymentSchema>;
export type BillFrequency = z.infer<typeof frequencyEnum>;
export type BillStatus = z.infer<typeof statusEnum>;
export type DebtPaymentType = z.infer<typeof paymentTypeEnum>;
export type DebtPaymentMode = z.infer<typeof paymentModeEnum>;
