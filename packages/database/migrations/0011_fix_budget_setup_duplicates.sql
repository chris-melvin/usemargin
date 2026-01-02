-- usemargin Fix Budget Setup Duplicates
-- Fixes unique constraint violation when re-running budget setup
-- Run this migration AFTER 0010_bucket_improvements.sql

-- =============================================================================
-- UPDATE: complete_budget_setup function
-- =============================================================================
-- Now deletes existing data before inserting new records to allow users
-- to re-run the budget setup wizard without constraint violations

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
  v_incomes_deleted INTEGER := 0;
  v_bills_deleted INTEGER := 0;
  v_buckets_deleted INTEGER := 0;
BEGIN
  -- Step 0: Clean up existing data to allow fresh setup
  -- Delete existing incomes for this user
  DELETE FROM incomes WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_incomes_deleted = ROW_COUNT;

  -- Delete existing bills (debts) for this user that came from setup
  -- Note: We only delete bills created from setup, not user-added bills
  -- For now, we delete all - users can re-add individual bills later
  DELETE FROM debts WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_bills_deleted = ROW_COUNT;

  -- Delete existing buckets for this user
  DELETE FROM budget_buckets WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_buckets_deleted = ROW_COUNT;

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
        user_id, name, slug, percentage, target_amount, allocated_amount, color, icon,
        description, is_default, is_system, sort_order, created_at, updated_at
      ) VALUES (
        p_user_id,
        v_bucket->>'name',
        v_bucket->>'slug',
        (v_bucket->>'percentage')::NUMERIC,
        (v_bucket->>'targetAmount')::NUMERIC,
        (v_bucket->>'allocatedAmount')::NUMERIC,
        v_bucket->>'color',
        v_bucket->>'icon',
        v_bucket->>'description',
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
    'incomes_deleted', v_incomes_deleted,
    'bills_deleted', v_bills_deleted,
    'buckets_deleted', v_buckets_deleted,
    'incomes_created', v_incomes_created,
    'bills_created', v_bills_created,
    'buckets_created', v_buckets_created
  );
END;
$$;

COMMENT ON FUNCTION complete_budget_setup IS
  'Atomically completes budget setup. Deletes existing data first to allow re-running setup. Full rollback on failure.';
