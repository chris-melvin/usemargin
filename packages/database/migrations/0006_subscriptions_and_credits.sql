-- usemargin Subscriptions & Credits Schema
-- Migration: 0006_subscriptions_and_credits.sql
--
-- Implements:
-- - Subscriptions table (synced from payment provider)
-- - User credits table (balance tracking)
-- - Credit transactions (audit log)
-- - Adds subscription_tier to user_settings for quick access

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider information
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('paddle', 'lemonsqueezy')),
  provider_subscription_id VARCHAR(255) NOT NULL,
  provider_customer_id VARCHAR(255) NOT NULL,

  -- Subscription state
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'trialing', 'past_due', 'paused', 'cancelled', 'expired')
  ),
  billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id),  -- One subscription per user
  UNIQUE(provider_subscription_id)
);

-- =============================================================================
-- USER CREDITS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current balance (always >= 0)
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),

  -- Subscription credits tracking
  subscription_credits_per_month INTEGER NOT NULL DEFAULT 0,
  last_refresh_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,

  -- Lifetime stats
  total_granted INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id)  -- One credits record per user
);

-- =============================================================================
-- CREDIT TRANSACTIONS TABLE (Audit Log)
-- =============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL CHECK (
    transaction_type IN (
      'subscription_grant',  -- Monthly credits from subscription
      'purchase',            -- One-time credit pack purchase
      'consumption',         -- Used credits for AI features
      'refund',              -- Credits returned (e.g., failed operation)
      'adjustment'           -- Admin adjustment
    )
  ),
  amount INTEGER NOT NULL,           -- Positive = add, Negative = deduct
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Context
  description TEXT NOT NULL,
  feature_id VARCHAR(100),           -- For consumption: 'insights', 'budget_improvement', etc.
  reference_id VARCHAR(255),         -- External reference (e.g., payment provider transaction ID)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ADD SUBSCRIPTION TIER TO USER SETTINGS
-- =============================================================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(10)
  DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro'));

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_id
  ON subscriptions(provider_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user
  ON user_credits(user_id);

CREATE INDEX IF NOT EXISTS idx_user_credits_next_refresh
  ON user_credits(next_refresh_at)
  WHERE subscription_credits_per_month > 0;

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_feature
  ON credit_transactions(feature_id)
  WHERE feature_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Inserts/updates are done via service role key (webhooks)

-- User credits policies
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- PROCESSED WEBHOOKS TABLE (Idempotency)
-- =============================================================================

CREATE TABLE IF NOT EXISTS processed_webhooks (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup of old webhooks (can be pruned after 7 days)
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at
  ON processed_webhooks(processed_at);

-- RLS for processed_webhooks (service role only - no user access needed)
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
-- No policies needed - only service role can access

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for user_credits
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
