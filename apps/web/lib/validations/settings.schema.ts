import { z } from "zod";

/**
 * Schema for updating user settings
 */
export const updateSettingsSchema = z.object({
  default_daily_limit: z.coerce
    .number()
    .positive("Daily limit must be positive")
    .max(999999999.99, "Daily limit too large")
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .optional(),
  timezone: z.string().max(50).optional(),
  week_starts_on: z.coerce.number().int().min(0).max(6).optional(),
});

/**
 * Schema for creating user settings (initial setup)
 */
export const createSettingsSchema = z.object({
  default_daily_limit: z.coerce
    .number()
    .positive("Daily limit must be positive")
    .max(999999999.99, "Daily limit too large")
    .default(300),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .default("PHP"),
  timezone: z.string().max(50).default("Asia/Manila"),
  week_starts_on: z.coerce.number().int().min(0).max(6).default(0),
});

// Export inferred types
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type CreateSettingsInput = z.infer<typeof createSettingsSchema>;
