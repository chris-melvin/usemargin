-- Migration: 0012_enhanced_debt_types.sql
-- Description: Add payment_type to debts and create debt_payments table for tracking payment history

-- =============================================================================
-- ADD PAYMENT TYPE TO DEBTS TABLE
-- =============================================================================

-- Add payment_type column to debts table
-- 'fixed' = same amount every period (default, current behavior)
-- 'variable' = user adjusts amount each period (e.g., credit card minimum varies)
ALTER TABLE debts ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20)
  NOT NULL DEFAULT 'fixed'
  CHECK (payment_type IN ('fixed', 'variable'));

-- Index for filtering by payment type
CREATE INDEX IF NOT EXISTS idx_debts_payment_type ON debts(user_id, payment_type) WHERE is_active = TRUE;

-- =============================================================================
-- DEBT PAYMENTS TABLE (for tracking payment history)
-- =============================================================================

-- This table tracks actual payments made to debts
-- Essential for:
-- 1. Variable debt payment history (credit cards, etc.)
-- 2. Payment trends and analytics
-- 3. Fixed debt payment verification
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,  -- Start of the billing period this payment covers
  period_end DATE NOT NULL,    -- End of the billing period
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for debt payments
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_date ON debt_payments(user_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_period ON debt_payments(debt_id, period_start);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Users can only view their own debt payments
CREATE POLICY "Users can view own debt payments"
  ON debt_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own debt payments
CREATE POLICY "Users can insert own debt payments"
  ON debt_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own debt payments
CREATE POLICY "Users can update own debt payments"
  ON debt_payments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own debt payments
CREATE POLICY "Users can delete own debt payments"
  ON debt_payments
  FOR DELETE
  USING (auth.uid() = user_id);
