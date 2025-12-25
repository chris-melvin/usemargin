-- Migration: 0003_onboarding.sql
-- Description: User onboarding progress tracking

-- Onboarding progress tracking table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core onboarding state
  has_completed_tour BOOLEAN NOT NULL DEFAULT FALSE,
  current_step INTEGER NOT NULL DEFAULT 0,
  tour_skipped_at TIMESTAMPTZ,
  tour_completed_at TIMESTAMPTZ,

  -- Progressive hints tracking (JSONB for flexibility)
  -- Format: { "hint_id": { "shown_at": "timestamp", "dismissed": boolean } }
  progressive_hints_shown JSONB NOT NULL DEFAULT '{}',

  -- Feature discovery tracking
  -- Format: { "feature_id": "first_used_at_timestamp" }
  features_discovered JSONB NOT NULL DEFAULT '{}',

  -- Usage metrics for hint timing
  expense_count INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON user_onboarding(user_id);

-- RLS policies
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update trigger (reuses existing function from 0002)
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
