-- usemargin Budget Buckets Schema
-- Run this migration AFTER 0003_onboarding.sql in your Supabase SQL editor

-- =============================================================================
-- PHASE 1: Create budget buckets table
-- =============================================================================

-- Budget buckets table (for allocating income to spending categories)
CREATE TABLE IF NOT EXISTS budget_buckets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL, -- 'savings', 'daily-spending', 'custom-xyz'
  percentage NUMERIC(5, 2) NOT NULL DEFAULT 0, -- e.g., 20.00 for 20%
  allocated_amount NUMERIC(12, 2), -- Calculated monthly amount in currency
  color VARCHAR(20), -- For UI visualization (hex color)
  icon VARCHAR(50), -- Lucide icon name
  is_default BOOLEAN NOT NULL DEFAULT FALSE, -- Is this the default bucket for expenses?
  is_system BOOLEAN NOT NULL DEFAULT FALSE, -- System bucket (can't delete)
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

-- =============================================================================
-- PHASE 2: Create expense bucket rules table
-- =============================================================================

-- Expense bucket rules table (for auto-assigning expenses to buckets)
CREATE TABLE IF NOT EXISTS expense_bucket_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id UUID NOT NULL REFERENCES budget_buckets(id) ON DELETE CASCADE,

  -- Rule matching
  match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('category', 'label', 'keyword')),
  match_value VARCHAR(255) NOT NULL, -- e.g., 'groceries', 'uber', etc.

  priority INTEGER NOT NULL DEFAULT 0, -- Higher = evaluated first

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, match_type, match_value)
);

-- =============================================================================
-- PHASE 3: Alter existing tables
-- =============================================================================

-- Add budget setup columns to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS budget_setup_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS total_monthly_income NUMERIC(12, 2);
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS total_fixed_expenses NUMERIC(12, 2);
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS calculated_daily_limit NUMERIC(12, 2);

-- Add budget setup tracking to user_onboarding
ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS budget_setup_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_onboarding ADD COLUMN IF NOT EXISTS budget_setup_step INTEGER NOT NULL DEFAULT 0;

-- Add bucket reference to expenses table (optional - for tracking which bucket an expense belongs to)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS bucket_id UUID REFERENCES budget_buckets(id) ON DELETE SET NULL;

-- =============================================================================
-- PHASE 4: Create indexes
-- =============================================================================

-- Budget buckets indexes
CREATE INDEX IF NOT EXISTS idx_budget_buckets_user ON budget_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_buckets_user_default ON budget_buckets(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_budget_buckets_user_sort ON budget_buckets(user_id, sort_order);

-- Expense bucket rules indexes
CREATE INDEX IF NOT EXISTS idx_expense_bucket_rules_user ON expense_bucket_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_bucket_rules_bucket ON expense_bucket_rules(bucket_id);
CREATE INDEX IF NOT EXISTS idx_expense_bucket_rules_priority ON expense_bucket_rules(user_id, priority DESC);

-- Enhanced index for expenses with bucket
CREATE INDEX IF NOT EXISTS idx_expenses_bucket ON expenses(bucket_id) WHERE bucket_id IS NOT NULL;

-- =============================================================================
-- PHASE 5: Enable RLS and create policies
-- =============================================================================

-- Budget buckets RLS
ALTER TABLE budget_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budget buckets" ON budget_buckets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budget buckets" ON budget_buckets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget buckets" ON budget_buckets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget buckets" ON budget_buckets FOR DELETE USING (auth.uid() = user_id);

-- Expense bucket rules RLS
ALTER TABLE expense_bucket_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expense bucket rules" ON expense_bucket_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expense bucket rules" ON expense_bucket_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expense bucket rules" ON expense_bucket_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expense bucket rules" ON expense_bucket_rules FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PHASE 6: Create triggers for auto-updating updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_budget_buckets_updated_at ON budget_buckets;
CREATE TRIGGER update_budget_buckets_updated_at BEFORE UPDATE ON budget_buckets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
