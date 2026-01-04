-- Migration: 0013_debt_payment_settings
-- Add payment mode and bucket assignment to debts for auto-deduct feature

-- Add payment mode to debts (manual vs auto-deduct)
ALTER TABLE debts
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) NOT NULL DEFAULT 'manual';

-- Add check constraint for payment_mode
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'debts_payment_mode_check'
  ) THEN
    ALTER TABLE debts
      ADD CONSTRAINT debts_payment_mode_check
      CHECK (payment_mode IN ('manual', 'auto_deduct'));
  END IF;
END $$;

-- Add payment bucket reference (which bucket to deduct from when paying)
ALTER TABLE debts
  ADD COLUMN IF NOT EXISTS payment_bucket_id UUID REFERENCES budget_buckets(id) ON DELETE SET NULL;

-- Index for finding debts by payment bucket
CREATE INDEX IF NOT EXISTS idx_debts_payment_bucket
  ON debts(payment_bucket_id) WHERE payment_bucket_id IS NOT NULL;

-- Add source bucket to debt_payments (tracks which bucket was deducted)
ALTER TABLE debt_payments
  ADD COLUMN IF NOT EXISTS source_bucket_id UUID REFERENCES budget_buckets(id) ON DELETE SET NULL;

-- Index for payment history by source bucket
CREATE INDEX IF NOT EXISTS idx_debt_payments_source_bucket
  ON debt_payments(source_bucket_id) WHERE source_bucket_id IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN debts.payment_mode IS 'Payment mode: manual (user records payment) or auto_deduct (deducts from bucket)';
COMMENT ON COLUMN debts.payment_bucket_id IS 'Bucket to deduct from when payment_mode is auto_deduct';
COMMENT ON COLUMN debt_payments.source_bucket_id IS 'Bucket that was deducted when this payment was made (if any)';
