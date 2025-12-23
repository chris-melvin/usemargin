-- usemargin Initial Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_daily_limit NUMERIC(12, 2) NOT NULL DEFAULT 300,
  currency VARCHAR(3) NOT NULL DEFAULT 'PHP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Overrides table (custom daily limits)
CREATE TABLE IF NOT EXISTS daily_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Flex Bucket table (one per user)
CREATE TABLE IF NOT EXISTS flex_bucket (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Flex Allocations table (flex bucket injections to specific days)
CREATE TABLE IF NOT EXISTS flex_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incomes table (recurring income)
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Debts table (recurring debt payments)
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_overrides_user_date ON daily_overrides(user_id, date);
CREATE INDEX IF NOT EXISTS idx_flex_allocations_user_date ON flex_allocations(user_id, date);
CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);

-- Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE flex_bucket ENABLE ROW LEVEL SECURITY;
ALTER TABLE flex_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own overrides" ON daily_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own overrides" ON daily_overrides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own overrides" ON daily_overrides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own overrides" ON daily_overrides FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flex bucket" ON flex_bucket FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flex bucket" ON flex_bucket FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flex bucket" ON flex_bucket FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flex allocations" ON flex_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flex allocations" ON flex_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flex allocations" ON flex_allocations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flex allocations" ON flex_allocations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incomes" ON incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own incomes" ON incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON incomes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own debts" ON debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (auth.uid() = user_id);
