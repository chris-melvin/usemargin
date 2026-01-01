-- usemargin Expense Soft Delete Schema
-- Run this migration AFTER 0008_feedback_and_roadmap.sql in your Supabase SQL editor

-- =============================================================================
-- PHASE 1: Add deleted_at column to expenses for soft delete
-- =============================================================================

-- Add deleted_at column - NULL means not deleted
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- =============================================================================
-- PHASE 2: Create partial index for efficient active expense queries
-- =============================================================================

-- Index for queries that filter out deleted expenses (most common)
-- Partial index only includes rows where deleted_at IS NULL for optimal performance
CREATE INDEX IF NOT EXISTS idx_expenses_not_deleted
ON expenses(user_id, date, created_at)
WHERE deleted_at IS NULL;

-- Index for finding deleted expenses within a time window (for undo/restore operations)
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at
ON expenses(user_id, deleted_at)
WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PHASE 3: Update RLS policies to exclude deleted expenses by default
-- =============================================================================

-- Drop and recreate the select policy to filter out deleted expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;

CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND deleted_at IS NULL
  );

-- Policy to allow viewing deleted expenses (for restore functionality)
CREATE POLICY "Users can view their own deleted expenses" ON expenses
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND deleted_at IS NOT NULL
  );

-- Update policy remains the same (can update any owned expense including deleted)
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;

CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- PHASE 4: Create helper function for soft delete
-- =============================================================================

-- Function to soft delete an expense
CREATE OR REPLACE FUNCTION soft_delete_expense(expense_id UUID)
RETURNS expenses AS $$
DECLARE
  deleted_expense expenses;
BEGIN
  UPDATE expenses
  SET deleted_at = NOW()
  WHERE id = expense_id AND user_id = auth.uid() AND deleted_at IS NULL
  RETURNING * INTO deleted_expense;

  RETURN deleted_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a soft-deleted expense
CREATE OR REPLACE FUNCTION restore_expense(expense_id UUID)
RETURNS expenses AS $$
DECLARE
  restored_expense expenses;
BEGIN
  UPDATE expenses
  SET deleted_at = NULL
  WHERE id = expense_id AND user_id = auth.uid() AND deleted_at IS NOT NULL
  RETURNING * INTO restored_expense;

  RETURN restored_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PHASE 5: Create cleanup job for permanently deleting old soft-deleted expenses
-- =============================================================================

-- Function to permanently delete expenses that have been soft-deleted for more than 30 days
-- This should be called by a scheduled job (e.g., pg_cron)
CREATE OR REPLACE FUNCTION cleanup_deleted_expenses()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM expenses
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
