-- Migration: Full Timestamp Migration
-- Description: Convert all DATE fields to TIMESTAMPTZ for proper timezone support
-- Date: 2026-02-01

-- =============================================================================
-- EXPENSES TABLE
-- Drop legacy date and time_of_day columns, use occurred_at exclusively
-- =============================================================================

-- Remove date and time_of_day columns (occurred_at already exists)
ALTER TABLE expenses
  DROP COLUMN IF EXISTS date,
  DROP COLUMN IF EXISTS time_of_day;

-- Ensure occurred_at is not null and has default
ALTER TABLE expenses
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN occurred_at SET DEFAULT NOW();

-- Update index for occurred_at
DROP INDEX IF EXISTS idx_expenses_user_date;
CREATE INDEX IF NOT EXISTS idx_expenses_user_occurred
  ON expenses(user_id, occurred_at DESC);

-- =============================================================================
-- DAILY OVERRIDES TABLE
-- Rename date to override_timestamp
-- =============================================================================

-- Rename and convert column
ALTER TABLE daily_overrides
  RENAME COLUMN date TO override_timestamp;

-- If the column was DATE type, convert to TIMESTAMPTZ
-- This converts date values to timestamps at midnight UTC
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_overrides'
    AND column_name = 'override_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE daily_overrides
      ALTER COLUMN override_timestamp TYPE TIMESTAMPTZ
      USING (override_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- Update index
DROP INDEX IF EXISTS idx_daily_overrides_user_date;
CREATE INDEX IF NOT EXISTS idx_daily_overrides_user_timestamp
  ON daily_overrides(user_id, override_timestamp DESC);

-- =============================================================================
-- FLEX ALLOCATIONS TABLE
-- Rename date to allocated_timestamp
-- =============================================================================

-- Rename and convert column
ALTER TABLE flex_allocations
  RENAME COLUMN date TO allocated_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flex_allocations'
    AND column_name = 'allocated_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE flex_allocations
      ALTER COLUMN allocated_timestamp TYPE TIMESTAMPTZ
      USING (allocated_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- Update index
DROP INDEX IF EXISTS idx_flex_allocations_user_date;
CREATE INDEX IF NOT EXISTS idx_flex_allocations_user_timestamp
  ON flex_allocations(user_id, allocated_timestamp DESC);

-- =============================================================================
-- INCOMES TABLE
-- Convert all date fields to timestamps
-- =============================================================================

-- Rename columns
ALTER TABLE incomes
  RENAME COLUMN start_date TO start_timestamp;
ALTER TABLE incomes
  RENAME COLUMN end_date TO end_timestamp;
ALTER TABLE incomes
  RENAME COLUMN expected_date TO expected_timestamp;
ALTER TABLE incomes
  RENAME COLUMN received_date TO received_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  -- Convert start_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incomes'
    AND column_name = 'start_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE incomes
      ALTER COLUMN start_timestamp TYPE TIMESTAMPTZ
      USING (start_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert end_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incomes'
    AND column_name = 'end_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE incomes
      ALTER COLUMN end_timestamp TYPE TIMESTAMPTZ
      USING (end_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert expected_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incomes'
    AND column_name = 'expected_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE incomes
      ALTER COLUMN expected_timestamp TYPE TIMESTAMPTZ
      USING (expected_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert received_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incomes'
    AND column_name = 'received_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE incomes
      ALTER COLUMN received_timestamp TYPE TIMESTAMPTZ
      USING (received_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- =============================================================================
-- DEBTS TABLE
-- Convert all date fields to timestamps
-- =============================================================================

-- Rename columns
ALTER TABLE debts
  RENAME COLUMN start_date TO start_timestamp;
ALTER TABLE debts
  RENAME COLUMN end_date TO end_timestamp;
ALTER TABLE debts
  RENAME COLUMN paid_date TO paid_timestamp;
ALTER TABLE debts
  RENAME COLUMN receive_date TO receive_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  -- Convert start_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts'
    AND column_name = 'start_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debts
      ALTER COLUMN start_timestamp TYPE TIMESTAMPTZ
      USING (start_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert end_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts'
    AND column_name = 'end_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debts
      ALTER COLUMN end_timestamp TYPE TIMESTAMPTZ
      USING (end_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert paid_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts'
    AND column_name = 'paid_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debts
      ALTER COLUMN paid_timestamp TYPE TIMESTAMPTZ
      USING (paid_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert receive_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts'
    AND column_name = 'receive_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debts
      ALTER COLUMN receive_timestamp TYPE TIMESTAMPTZ
      USING (receive_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- =============================================================================
-- DEBT PAYMENTS TABLE
-- Convert all date fields to timestamps
-- =============================================================================

-- Rename columns
ALTER TABLE debt_payments
  RENAME COLUMN payment_date TO payment_timestamp;
ALTER TABLE debt_payments
  RENAME COLUMN period_start TO period_start_timestamp;
ALTER TABLE debt_payments
  RENAME COLUMN period_end TO period_end_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  -- Convert payment_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debt_payments'
    AND column_name = 'payment_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debt_payments
      ALTER COLUMN payment_timestamp TYPE TIMESTAMPTZ
      USING (payment_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert period_start_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debt_payments'
    AND column_name = 'period_start_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debt_payments
      ALTER COLUMN period_start_timestamp TYPE TIMESTAMPTZ
      USING (period_start_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;

  -- Convert period_end_timestamp
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debt_payments'
    AND column_name = 'period_end_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE debt_payments
      ALTER COLUMN period_end_timestamp TYPE TIMESTAMPTZ
      USING (period_end_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- =============================================================================
-- RECURRING EXPENSES TABLE
-- Convert next_occurrence to timestamp
-- =============================================================================

-- Rename column
ALTER TABLE recurring_expenses
  RENAME COLUMN next_occurrence TO next_occurrence_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses'
    AND column_name = 'next_occurrence_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE recurring_expenses
      ALTER COLUMN next_occurrence_timestamp TYPE TIMESTAMPTZ
      USING (next_occurrence_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- Update index
DROP INDEX IF EXISTS idx_recurring_expenses_next_occurrence;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_occurrence_timestamp
  ON recurring_expenses(user_id, next_occurrence_timestamp)
  WHERE is_active = true;

-- =============================================================================
-- SAVINGS TRANSACTIONS TABLE
-- Convert date to transaction_timestamp
-- =============================================================================

-- Rename column
ALTER TABLE savings_transactions
  RENAME COLUMN date TO transaction_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_transactions'
    AND column_name = 'transaction_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE savings_transactions
      ALTER COLUMN transaction_timestamp TYPE TIMESTAMPTZ
      USING (transaction_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- Update index
DROP INDEX IF EXISTS idx_savings_transactions_user_date;
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_timestamp
  ON savings_transactions(user_id, transaction_timestamp DESC);

-- =============================================================================
-- SAVINGS GOALS TABLE
-- Convert target_date to target_timestamp
-- =============================================================================

-- Rename column
ALTER TABLE savings_goals
  RENAME COLUMN target_date TO target_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals'
    AND column_name = 'target_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE savings_goals
      ALTER COLUMN target_timestamp TYPE TIMESTAMPTZ
      USING (target_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- =============================================================================
-- NET WORTH SNAPSHOTS TABLE
-- Convert date to snapshot_timestamp
-- =============================================================================

-- Rename column
ALTER TABLE net_worth_snapshots
  RENAME COLUMN date TO snapshot_timestamp;

-- Convert to TIMESTAMPTZ if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'net_worth_snapshots'
    AND column_name = 'snapshot_timestamp'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE net_worth_snapshots
      ALTER COLUMN snapshot_timestamp TYPE TIMESTAMPTZ
      USING (snapshot_timestamp::timestamp AT TIME ZONE 'UTC');
  END IF;
END $$;

-- Set default to NOW() for snapshot_timestamp
ALTER TABLE net_worth_snapshots
  ALTER COLUMN snapshot_timestamp SET DEFAULT NOW();

-- Update index
DROP INDEX IF EXISTS idx_net_worth_snapshots_user_date;
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_timestamp
  ON net_worth_snapshots(user_id, snapshot_timestamp DESC);

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify success
-- =============================================================================

-- Check for any remaining DATE columns (should be empty for user tables)
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE data_type = 'date'
-- AND table_schema = 'public'
-- AND table_name NOT LIKE 'pg_%'
-- ORDER BY table_name, column_name;

-- Check for any timestamp without timezone columns (should be empty)
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE data_type = 'timestamp without time zone'
-- AND table_schema = 'public'
-- AND table_name NOT LIKE 'pg_%'
-- ORDER BY table_name, column_name;

-- Verify all new timestamp indexes exist
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE '%timestamp%'
-- ORDER BY tablename, indexname;
