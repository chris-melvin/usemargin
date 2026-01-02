-- usemargin Bucket Improvements
-- Adds support for fixed-amount buckets (alternative to percentage-based)
-- Run this migration AFTER 0009_expense_soft_delete.sql

-- =============================================================================
-- PHASE 1: Add target_amount field for fixed-amount buckets
-- =============================================================================

-- Add target_amount field - allows buckets to have a fixed monthly amount
-- instead of a percentage. Bucket can have EITHER percentage OR target_amount.
ALTER TABLE budget_buckets
  ADD COLUMN IF NOT EXISTS target_amount NUMERIC(12, 2) NULL;

-- Add description field for bucket explanations/tooltips
ALTER TABLE budget_buckets
  ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- =============================================================================
-- PHASE 2: Make percentage nullable
-- =============================================================================

-- Allow percentage to be null (for fixed-amount buckets)
ALTER TABLE budget_buckets
  ALTER COLUMN percentage DROP NOT NULL,
  ALTER COLUMN percentage DROP DEFAULT;

-- =============================================================================
-- PHASE 3: Add constraint to ensure bucket has either percentage or target_amount
-- =============================================================================

-- Note: We're not enforcing this at DB level to allow flexibility
-- The app will validate that at least one is set

-- Add comment explaining the fields
COMMENT ON COLUMN budget_buckets.percentage IS 'Percentage of remaining budget (0-100). Either this OR target_amount should be set.';
COMMENT ON COLUMN budget_buckets.target_amount IS 'Fixed monthly amount. Either this OR percentage should be set.';
COMMENT ON COLUMN budget_buckets.description IS 'User-facing description for tooltips/help text.';
