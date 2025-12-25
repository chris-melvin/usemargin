import { z } from "zod";

/**
 * Schema for updating flex bucket balance
 */
export const updateFlexBucketSchema = z.object({
  balance: z.coerce
    .number()
    .min(-999999999.99, "Balance too low")
    .max(999999999.99, "Balance too high"),
});

/**
 * Schema for creating a flex allocation
 */
export const createFlexAllocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  amount: z.coerce
    .number()
    .positive("Amount must be positive")
    .max(999999999.99, "Amount too large"),
  notes: z.string().max(500).optional().nullable(),
});

/**
 * Schema for updating a flex allocation
 */
export const updateFlexAllocationSchema = createFlexAllocationSchema.partial();

/**
 * Schema for daily override (custom daily limit)
 */
export const createDailyOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  limit_amount: z.coerce
    .number()
    .positive("Limit must be positive")
    .max(999999999.99, "Limit too large"),
});

/**
 * Schema for updating a daily override
 */
export const updateDailyOverrideSchema = z.object({
  limit_amount: z.coerce
    .number()
    .positive("Limit must be positive")
    .max(999999999.99, "Limit too large"),
});

// Export inferred types
export type UpdateFlexBucketInput = z.infer<typeof updateFlexBucketSchema>;
export type CreateFlexAllocationInput = z.infer<typeof createFlexAllocationSchema>;
export type UpdateFlexAllocationInput = z.infer<typeof updateFlexAllocationSchema>;
export type CreateDailyOverrideInput = z.infer<typeof createDailyOverrideSchema>;
export type UpdateDailyOverrideInput = z.infer<typeof updateDailyOverrideSchema>;
