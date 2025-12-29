-- usemargin Atomic Operations
-- Migration: 0007_atomic_operations.sql
--
-- Implements atomic PostgreSQL functions for:
-- - Credit addition (prevents race conditions on concurrent webhooks)
-- - Subscription creation (atomic multi-step operation)
-- - Budget setup completion (atomic multi-insert with rollback)
-- - Default bucket setting (atomic single-update)

-- =============================================================================
-- FUNCTION 1: add_credits_atomic
-- =============================================================================
-- Atomically adds credits to a user's balance and creates a transaction record
-- Prevents race conditions where concurrent requests could lose credits

CREATE OR REPLACE FUNCTION add_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type VARCHAR(50),
  p_description TEXT,
  p_reference_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  balance INTEGER,
  subscription_credits_per_month INTEGER,
  total_granted INTEGER,
  total_consumed INTEGER,
  total_purchased INTEGER,
  last_refresh_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_current_granted INTEGER;
  v_current_purchased INTEGER;
  v_now TIMESTAMPTZ := NOW();
  v_next_refresh TIMESTAMPTZ;
  v_record user_credits%ROWTYPE;
BEGIN
  -- Ensure user_credits record exists (atomic upsert)
  INSERT INTO user_credits (user_id, balance, subscription_credits_per_month, total_granted, total_consumed, total_purchased)
  VALUES (p_user_id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock and read current record for update
  SELECT * INTO v_record
  FROM user_credits uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;

  v_current_balance := v_record.balance;
  v_new_balance := v_current_balance + p_amount;
  v_current_granted := v_record.total_granted;
  v_current_purchased := v_record.total_purchased;

  -- Calculate next refresh if this is a subscription grant
  IF p_transaction_type = 'subscription_grant' THEN
    v_next_refresh := v_now + INTERVAL '1 month';
  ELSE
    v_next_refresh := v_record.next_refresh_at;
  END IF;

  -- Atomic update
  UPDATE user_credits
  SET
    balance = v_new_balance,
    total_granted = CASE
      WHEN p_transaction_type = 'subscription_grant' THEN total_granted + p_amount
      ELSE total_granted
    END,
    total_purchased = CASE
      WHEN p_transaction_type = 'purchase' THEN total_purchased + p_amount
      ELSE total_purchased
    END,
    last_refresh_at = CASE
      WHEN p_transaction_type = 'subscription_grant' THEN v_now
      ELSE last_refresh_at
    END,
    next_refresh_at = v_next_refresh,
    updated_at = v_now
  WHERE user_credits.user_id = p_user_id;

  -- Create transaction record (within same transaction)
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_before, balance_after, description, reference_id
  ) VALUES (
    p_user_id, p_transaction_type, p_amount, v_current_balance, v_new_balance, p_description, p_reference_id
  );

  -- Return updated record
  RETURN QUERY
  SELECT
    uc.id,
    uc.user_id,
    uc.balance,
    uc.subscription_credits_per_month,
    uc.total_granted,
    uc.total_consumed,
    uc.total_purchased,
    uc.last_refresh_at,
    uc.next_refresh_at,
    uc.created_at,
    uc.updated_at
  FROM user_credits uc
  WHERE uc.user_id = p_user_id;
END;
$$;

-- =============================================================================
-- FUNCTION 2: consume_credits_atomic
-- =============================================================================
-- Atomically consumes credits from a user's balance and creates a transaction record
-- Returns NULL if insufficient balance (caller should check for this)
-- Prevents race conditions where concurrent requests could overdraw

CREATE OR REPLACE FUNCTION consume_credits_atomic(
  p_user_id UUID,
  p_amount INTEGER,
  p_feature_id VARCHAR(50),
  p_description TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  balance INTEGER,
  subscription_credits_per_month INTEGER,
  total_granted INTEGER,
  total_consumed INTEGER,
  total_purchased INTEGER,
  last_refresh_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_current_consumed INTEGER;
  v_now TIMESTAMPTZ := NOW();
  v_record user_credits%ROWTYPE;
BEGIN
  -- Lock and read current record for update
  SELECT * INTO v_record
  FROM user_credits uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;

  -- If no record exists, return empty (insufficient balance)
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_current_balance := v_record.balance;
  v_current_consumed := v_record.total_consumed;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN; -- Return empty result set (insufficient balance)
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- Atomic update
  UPDATE user_credits
  SET
    balance = v_new_balance,
    total_consumed = total_consumed + p_amount,
    updated_at = v_now
  WHERE user_credits.user_id = p_user_id;

  -- Create transaction record (within same transaction)
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_before, balance_after, description, feature_id
  ) VALUES (
    p_user_id, 'consumption', -p_amount, v_current_balance, v_new_balance, p_description, p_feature_id
  );

  -- Return updated record
  RETURN QUERY
  SELECT
    uc.id,
    uc.user_id,
    uc.balance,
    uc.subscription_credits_per_month,
    uc.total_granted,
    uc.total_consumed,
    uc.total_purchased,
    uc.last_refresh_at,
    uc.next_refresh_at,
    uc.created_at,
    uc.updated_at
  FROM user_credits uc
  WHERE uc.user_id = p_user_id;
END;
$$;

-- =============================================================================
-- FUNCTION 3: handle_subscription_created
-- =============================================================================
-- Atomically creates subscription, updates settings, and grants credits
-- If any step fails, the entire operation is rolled back

CREATE OR REPLACE FUNCTION handle_subscription_created(
  p_user_id UUID,
  p_provider VARCHAR(20),
  p_provider_subscription_id VARCHAR(255),
  p_provider_customer_id VARCHAR(255),
  p_status VARCHAR(20),
  p_billing_cycle VARCHAR(10),
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN,
  p_credits_per_month INTEGER,
  p_subscription_tier VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_subscription_id UUID;
  v_current_balance INTEGER := 0;
  v_new_balance INTEGER;
  v_next_refresh TIMESTAMPTZ;
BEGIN
  -- Step 1: Upsert subscription
  INSERT INTO subscriptions (
    user_id, provider, provider_subscription_id, provider_customer_id,
    status, billing_cycle, current_period_start, current_period_end,
    cancel_at_period_end, created_at, updated_at
  ) VALUES (
    p_user_id, p_provider, p_provider_subscription_id, p_provider_customer_id,
    p_status, p_billing_cycle, p_current_period_start, p_current_period_end,
    p_cancel_at_period_end, v_now, v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    provider_customer_id = EXCLUDED.provider_customer_id,
    status = EXCLUDED.status,
    billing_cycle = EXCLUDED.billing_cycle,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = v_now
  RETURNING id INTO v_subscription_id;

  -- Step 2: Upsert user_settings
  INSERT INTO user_settings (user_id, subscription_tier, created_at, updated_at)
  VALUES (p_user_id, p_subscription_tier, v_now, v_now)
  ON CONFLICT (user_id) DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    updated_at = v_now;

  -- Step 3: Ensure user_credits exists and get current balance
  INSERT INTO user_credits (user_id, balance, subscription_credits_per_month, total_granted, total_consumed, total_purchased)
  VALUES (p_user_id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_new_balance := v_current_balance + p_credits_per_month;
  v_next_refresh := v_now + INTERVAL '1 month';

  -- Step 4: Add credits atomically + set subscription_credits_per_month
  UPDATE user_credits
  SET
    balance = v_new_balance,
    subscription_credits_per_month = p_credits_per_month,
    total_granted = total_granted + p_credits_per_month,
    last_refresh_at = v_now,
    next_refresh_at = v_next_refresh,
    updated_at = v_now
  WHERE user_id = p_user_id;

  -- Step 5: Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_before, balance_after, description
  ) VALUES (
    p_user_id, 'subscription_grant', p_credits_per_month,
    v_current_balance, v_new_balance,
    'Initial Pro subscription credits'
  );

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'credits_added', p_credits_per_month,
    'new_balance', v_new_balance
  );
END;
$$;

-- =============================================================================
-- FUNCTION 4: set_default_bucket
-- =============================================================================
-- Atomically sets one bucket as default and clears all others
-- Prevents race conditions where two concurrent calls could result in 0 or 2 defaults

CREATE OR REPLACE FUNCTION set_default_bucket(
  p_user_id UUID,
  p_bucket_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bucket_exists BOOLEAN;
BEGIN
  -- Verify the bucket exists and belongs to the user
  SELECT EXISTS (
    SELECT 1 FROM budget_buckets
    WHERE id = p_bucket_id AND user_id = p_user_id
  ) INTO v_bucket_exists;

  IF NOT v_bucket_exists THEN
    RAISE EXCEPTION 'Bucket not found or does not belong to user';
  END IF;

  -- Single atomic UPDATE that sets the specified bucket to true and all others to false
  UPDATE budget_buckets
  SET
    is_default = (id = p_bucket_id),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Verify exactly one default exists
  IF NOT EXISTS (
    SELECT 1 FROM budget_buckets
    WHERE user_id = p_user_id AND is_default = true
  ) THEN
    RAISE EXCEPTION 'No default bucket set after operation';
  END IF;
END;
$$;

-- =============================================================================
-- FUNCTION 5: complete_budget_setup
-- =============================================================================
-- Atomically completes the entire budget setup process
-- If any insert fails, all changes are rolled back

CREATE OR REPLACE FUNCTION complete_budget_setup(
  p_user_id UUID,
  p_incomes JSONB,
  p_bills JSONB,
  p_buckets JSONB,
  p_daily_limit NUMERIC,
  p_total_monthly_income NUMERIC,
  p_total_fixed_expenses NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_income JSONB;
  v_bill JSONB;
  v_bucket JSONB;
  v_sort_order INTEGER := 0;
  v_incomes_created INTEGER := 0;
  v_bills_created INTEGER := 0;
  v_buckets_created INTEGER := 0;
BEGIN
  -- Step 1: Insert incomes
  IF p_incomes IS NOT NULL AND jsonb_array_length(p_incomes) > 0 THEN
    FOR v_income IN SELECT * FROM jsonb_array_elements(p_incomes)
    LOOP
      INSERT INTO incomes (
        user_id, label, amount, frequency, day_of_month, is_active, status,
        day_of_week, start_date, end_date, expected_date, received_date, created_at, updated_at
      ) VALUES (
        p_user_id,
        v_income->>'label',
        (v_income->>'amount')::NUMERIC,
        v_income->>'frequency',
        (v_income->>'dayOfMonth')::INTEGER,
        true,
        'expected',
        NULL, NULL, NULL, NULL, NULL,
        v_now, v_now
      );
      v_incomes_created := v_incomes_created + 1;
    END LOOP;
  END IF;

  -- Step 2: Insert bills (as debts)
  IF p_bills IS NOT NULL AND jsonb_array_length(p_bills) > 0 THEN
    FOR v_bill IN SELECT * FROM jsonb_array_elements(p_bills)
    LOOP
      INSERT INTO debts (
        user_id, label, amount, frequency, due_date, is_active, is_recurring, status,
        icon, total_amount, remaining_balance, interest_rate, minimum_payment,
        day_of_week, start_date, end_date, paid_date, receive_date, created_at, updated_at
      ) VALUES (
        p_user_id,
        v_bill->>'label',
        (v_bill->>'amount')::NUMERIC,
        v_bill->>'frequency',
        (v_bill->>'dueDate')::INTEGER,
        true,
        true,
        'pending',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        v_now, v_now
      );
      v_bills_created := v_bills_created + 1;
    END LOOP;
  END IF;

  -- Step 3: Insert buckets with sort_order
  IF p_buckets IS NOT NULL AND jsonb_array_length(p_buckets) > 0 THEN
    v_sort_order := 0;
    FOR v_bucket IN SELECT * FROM jsonb_array_elements(p_buckets)
    LOOP
      INSERT INTO budget_buckets (
        user_id, name, slug, percentage, allocated_amount, color, icon,
        is_default, is_system, sort_order, created_at, updated_at
      ) VALUES (
        p_user_id,
        v_bucket->>'name',
        v_bucket->>'slug',
        (v_bucket->>'percentage')::NUMERIC,
        (v_bucket->>'allocatedAmount')::NUMERIC,
        v_bucket->>'color',
        v_bucket->>'icon',
        COALESCE((v_bucket->>'isDefault')::BOOLEAN, false),
        COALESCE((v_bucket->>'isSystem')::BOOLEAN, false),
        v_sort_order,
        v_now, v_now
      );
      v_sort_order := v_sort_order + 1;
      v_buckets_created := v_buckets_created + 1;
    END LOOP;
  END IF;

  -- Step 4: Upsert user_settings
  INSERT INTO user_settings (
    user_id, default_daily_limit, budget_setup_completed,
    total_monthly_income, total_fixed_expenses, calculated_daily_limit,
    created_at, updated_at
  ) VALUES (
    p_user_id, p_daily_limit, true,
    p_total_monthly_income, p_total_fixed_expenses, p_daily_limit,
    v_now, v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    default_daily_limit = EXCLUDED.default_daily_limit,
    budget_setup_completed = true,
    total_monthly_income = EXCLUDED.total_monthly_income,
    total_fixed_expenses = EXCLUDED.total_fixed_expenses,
    calculated_daily_limit = EXCLUDED.calculated_daily_limit,
    updated_at = v_now;

  -- Step 5: Upsert user_onboarding
  INSERT INTO user_onboarding (
    user_id, budget_setup_completed, budget_setup_step, created_at, updated_at
  ) VALUES (
    p_user_id, true, 4, v_now, v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    budget_setup_completed = true,
    budget_setup_step = 4,
    updated_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'incomes_created', v_incomes_created,
    'bills_created', v_bills_created,
    'buckets_created', v_buckets_created
  );
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users (for user-initiated operations)
GRANT EXECUTE ON FUNCTION consume_credits_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION set_default_bucket TO authenticated;
GRANT EXECUTE ON FUNCTION complete_budget_setup TO authenticated;

-- Grant execute permissions to service role (for webhook operations)
GRANT EXECUTE ON FUNCTION add_credits_atomic TO service_role;
GRANT EXECUTE ON FUNCTION consume_credits_atomic TO service_role;
GRANT EXECUTE ON FUNCTION handle_subscription_created TO service_role;
GRANT EXECUTE ON FUNCTION set_default_bucket TO service_role;
GRANT EXECUTE ON FUNCTION complete_budget_setup TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION add_credits_atomic IS
  'Atomically adds credits to a user balance and creates transaction record. Prevents race conditions.';

COMMENT ON FUNCTION consume_credits_atomic IS
  'Atomically consumes credits from a user balance and creates transaction record. Returns empty if insufficient balance.';

COMMENT ON FUNCTION handle_subscription_created IS
  'Atomically creates subscription, updates settings, and grants initial credits. Full rollback on failure.';

COMMENT ON FUNCTION set_default_bucket IS
  'Atomically sets one bucket as default and clears all others. Prevents race conditions.';

COMMENT ON FUNCTION complete_budget_setup IS
  'Atomically completes budget setup with all inserts in a single transaction. Full rollback on failure.';
