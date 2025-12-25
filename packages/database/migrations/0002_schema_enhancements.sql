-- usemargin Schema Enhancements
-- Run this migration AFTER 0001_initial_schema.sql in your Supabase SQL editor

-- =============================================================================
-- PHASE 1: Create new independent tables (no foreign key dependencies)
-- =============================================================================

-- Categories table (custom user categories with hierarchy)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon VARCHAR(10),
  color VARCHAR(20),
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name, parent_id)
);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  icon VARCHAR(10),
  color VARCHAR(20),
  target_date DATE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets table (for net worth tracking)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'investment', 'property', 'vehicle', 'crypto', 'retirement', 'other')),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  institution VARCHAR(255),
  account_number VARCHAR(50),
  notes TEXT,
  is_liquid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Liabilities table (for net worth tracking)
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit_card', 'personal_loan', 'auto_loan', 'mortgage', 'student_loan', 'other')),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5, 4),
  minimum_payment NUMERIC(12, 2),
  institution VARCHAR(255),
  account_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Net worth snapshots table (historical data)
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_assets NUMERIC(14, 2) NOT NULL,
  total_liabilities NUMERIC(14, 2) NOT NULL,
  net_worth NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =============================================================================
-- PHASE 2: Create tables with foreign keys to Phase 1 tables
-- =============================================================================

-- Recurring expenses table (subscription templates)
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category VARCHAR(100),
  notes TEXT,
  icon VARCHAR(10),
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_log BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shortcuts table (custom @keyword shortcuts)
CREATE TABLE IF NOT EXISTS shortcuts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category VARCHAR(100),
  icon VARCHAR(10),
  default_amount NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trigger)
);

-- Savings transactions table
CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  savings_goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('contribution', 'withdrawal', 'interest', 'adjustment')),
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PHASE 3: Alter existing tables (add new columns)
-- =============================================================================

-- Add columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS time_of_day TIME;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_expense_id UUID REFERENCES recurring_expenses(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add columns to incomes table
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'once'));
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6);
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS expected_date DATE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'expected' CHECK (status IN ('pending', 'expected', 'received'));
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Make day_of_month nullable in incomes (for non-monthly frequencies)
ALTER TABLE incomes ALTER COLUMN day_of_month DROP NOT NULL;

-- Add columns to debts table
ALTER TABLE debts ADD COLUMN IF NOT EXISTS icon VARCHAR(10);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(12, 2);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5, 4);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS minimum_payment NUMERIC(12, 2);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly', 'once'));
ALTER TABLE debts ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6);
ALTER TABLE debts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partially_paid'));
ALTER TABLE debts ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS receive_date DATE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Make due_date nullable in debts (for non-monthly frequencies)
ALTER TABLE debts ALTER COLUMN due_date DROP NOT NULL;

-- Add columns to user_settings table
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Manila';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS week_starts_on INTEGER NOT NULL DEFAULT 0 CHECK (week_starts_on >= 0 AND week_starts_on <= 6);
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_savings_in_allocation BOOLEAN NOT NULL DEFAULT TRUE;

-- Add columns to flex_allocations table
ALTER TABLE flex_allocations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE flex_allocations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- =============================================================================
-- PHASE 4: Create indexes for new columns and tables
-- =============================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id) WHERE parent_id IS NOT NULL;

-- Recurring expenses indexes
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_next_occurrence ON recurring_expenses(user_id, next_occurrence) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_category ON recurring_expenses(category_id) WHERE category_id IS NOT NULL;

-- Shortcuts indexes
CREATE INDEX IF NOT EXISTS idx_shortcuts_user ON shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_shortcuts_trigger ON shortcuts(user_id, trigger);

-- Savings goals indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);

-- Savings transactions indexes
CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal ON savings_transactions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user_date ON savings_transactions(user_id, date);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(user_id, type);

-- Liabilities indexes
CREATE INDEX IF NOT EXISTS idx_liabilities_user ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_type ON liabilities(user_id, type);

-- Net worth snapshots indexes
CREATE INDEX IF NOT EXISTS idx_net_worth_snapshots_user_date ON net_worth_snapshots(user_id, date);

-- Enhanced indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(user_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_recurring ON expenses(recurring_expense_id) WHERE recurring_expense_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_incomes_status ON incomes(user_id, status) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(user_id, status) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_debts_due ON debts(user_id, due_date) WHERE is_active = TRUE AND status != 'paid';

-- =============================================================================
-- PHASE 5: Enable RLS and create policies for new tables
-- =============================================================================

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Recurring expenses RLS
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recurring expenses" ON recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring expenses" ON recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring expenses" ON recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring expenses" ON recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- Shortcuts RLS
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own shortcuts" ON shortcuts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shortcuts" ON shortcuts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shortcuts" ON shortcuts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shortcuts" ON shortcuts FOR DELETE USING (auth.uid() = user_id);

-- Savings goals RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own savings goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- Savings transactions RLS
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own savings transactions" ON savings_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings transactions" ON savings_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings transactions" ON savings_transactions FOR DELETE USING (auth.uid() = user_id);

-- Assets RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

-- Liabilities RLS
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- Net worth snapshots RLS
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own net worth snapshots" ON net_worth_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own net worth snapshots" ON net_worth_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own net worth snapshots" ON net_worth_snapshots FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PHASE 6: Create trigger function for auto-updating updated_at
-- =============================================================================

-- Create the trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incomes_updated_at ON incomes;
CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flex_bucket_updated_at ON flex_bucket;
CREATE TRIGGER update_flex_bucket_updated_at BEFORE UPDATE ON flex_bucket
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flex_allocations_updated_at ON flex_allocations;
CREATE TRIGGER update_flex_allocations_updated_at BEFORE UPDATE ON flex_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_expenses_updated_at ON recurring_expenses;
CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shortcuts_updated_at ON shortcuts;
CREATE TRIGGER update_shortcuts_updated_at BEFORE UPDATE ON shortcuts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_liabilities_updated_at ON liabilities;
CREATE TRIGGER update_liabilities_updated_at BEFORE UPDATE ON liabilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
