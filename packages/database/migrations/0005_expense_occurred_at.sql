-- usemargin Expense Occurred At Schema
-- Run this migration AFTER 0004_budget_buckets.sql in your Supabase SQL editor

-- =============================================================================
-- PHASE 1: Add occurred_at timestamp to expenses
-- =============================================================================

-- Add occurred_at column for accurate timestamp of when expense occurred
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ;

-- =============================================================================
-- PHASE 2: Migrate existing data
-- =============================================================================

-- Populate occurred_at from existing date + time_of_day columns
-- If time_of_day exists, combine with date; otherwise use date at start of day
UPDATE expenses
SET occurred_at = CASE
  WHEN time_of_day IS NOT NULL THEN
    (date::timestamp + time_of_day)::timestamptz
  ELSE
    date::timestamptz
  END
WHERE occurred_at IS NULL;

-- =============================================================================
-- PHASE 3: Create index for time-based queries
-- =============================================================================

-- Index for time-range queries and visualizations
CREATE INDEX IF NOT EXISTS idx_expenses_occurred_at ON expenses(user_id, occurred_at);
