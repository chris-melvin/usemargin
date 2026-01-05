-- Add creditor column for tracking who the debt is owed to (person/company)
-- Useful for one-time debts like personal loans from friends/family

ALTER TABLE debts ADD COLUMN IF NOT EXISTS creditor TEXT;

-- Add index for searching by creditor
CREATE INDEX IF NOT EXISTS idx_debts_creditor ON debts(creditor) WHERE creditor IS NOT NULL;

COMMENT ON COLUMN debts.creditor IS 'Person or company the debt is owed to (e.g., "Juan Santos", "BDO")';
