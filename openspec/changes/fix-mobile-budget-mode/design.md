## Context

The mobile app has two tracking modes: "Simple Tracking" (`tracking_only`) and "Budget Mode" (`budget_enabled`). Budget mode relies on `calculated_daily_limit` to show remaining budget, progress bars, and status badges. However, the mobile BudgetSettings component only saves `total_monthly_income` and `total_fixed_expenses` as individual fields — it never recalculates the daily limit. The web app handles this in `apps/web/lib/budget-setup/calculations.ts` during its setup wizard, but that logic has no mobile equivalent.

Additionally, the HeroDailyCard renders identically in both modes except for subtitle text and a status badge — the progress bar and limit labels still appear in simple tracking, which is confusing.

**Current mobile budget flow:**
1. User enters income → saved to DB
2. User enters fixed expenses → saved to DB
3. `calculated_daily_limit` remains `null`
4. Fallback: `default_daily_limit` (300) is used everywhere

## Goals / Non-Goals

**Goals:**
- Mobile budget calculation works: changing income or fixed expenses immediately recalculates `calculated_daily_limit`
- Users can manually override the daily limit on mobile
- Simple tracking mode has a clean, budget-free UI
- Calculation logic is shared between web and mobile via `@repo/shared`

**Non-Goals:**
- Full budget setup wizard on mobile (that's a separate future change)
- Budget buckets on mobile (savings, custom allocations)
- Rollover calculations (separate enhancement)
- Changing the web budget flow in any way

## Decisions

### 1. Extract calculation to `@repo/shared`

**Decision**: Move the core formula `Math.floor((income - fixedExpenses) / daysInMonth)` into `@repo/shared/src/budget.ts` so both web and mobile use the same function.

**Why over alternatives:**
- **Alt: Duplicate the formula in mobile** — Simple but divergence risk. Both platforms should agree on the math.
- **Alt: Use web's `calculateBudgetSummary()`** — Too coupled to web's wizard types (`WizardIncome`, `WizardBill`, `WizardBucket`). Mobile's budget settings are simpler (just income + expenses).

The shared function will be a simple pure function:
```
calculateSimpleDailyLimit(monthlyIncome, fixedExpenses, daysInMonth) → number
```

Web can continue using its more complex `calculateBudgetSummary()` for the wizard while also having access to the simple version.

### 2. Recalculate in `updateSetting` flow

**Decision**: When `total_monthly_income` or `total_fixed_expenses` changes via `updateSetting()`, automatically recalculate and persist `calculated_daily_limit` in the same transaction.

**Why**: This keeps calculation co-located with the write. No separate "recalculate" step the UI needs to trigger. The hook already does a DB write + sync queue enqueue — we add one more UPDATE in the same flow.

### 3. Conditional rendering in HeroDailyCard

**Decision**: Use `isBudgetMode` prop (already passed) to conditionally render:
- **Budget mode**: Progress bar, limit labels, status badge, "remaining" subtitle — as today
- **Simple tracking**: Just the amount + "spent today" subtitle, no progress bar, no limits

**Why over alternatives:**
- **Alt: Two separate card components** — Over-engineered for what's a few conditional lines
- **Alt: CSS-only hiding** — Still renders DOM nodes, and the layout shift matters

### 4. Editable daily limit as a direct input

**Decision**: Add a "Daily Limit" text input to BudgetSettings that writes to `default_daily_limit`. Show this above the calculated limit section. When the user has both income/expenses AND a manual override, the calculated value takes precedence (matching web behavior where `calculated_daily_limit ?? default_daily_limit` is the resolution order).

## Risks / Trade-offs

**[Days-in-month changes mid-session]** → The calculated limit uses current month's days. If the app stays open across a month boundary, the limit won't update until next settings refresh. Acceptable for now — the sync/refresh cycle handles this naturally.

**[Manual vs calculated limit confusion]** → Users might set a manual limit, then enter income/expenses expecting the calculated value to "win." The resolution order (`calculated_daily_limit ?? default_daily_limit`) means the calculated value does take precedence once set. We'll add helper text clarifying this.

**[Sync race conditions]** → If user edits budget on web and mobile simultaneously, last-write-wins applies (already the sync model). No new risk here.
