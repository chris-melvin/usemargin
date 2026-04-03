## 1. Shared Calculation Function

- [x] 1.1 Create `packages/shared/src/budget.ts` with `calculateSimpleDailyLimit(monthlyIncome, fixedExpenses, daysInMonth)` that returns `Math.max(0, Math.floor((monthlyIncome - fixedExpenses) / daysInMonth))`
- [x] 1.2 Export from `packages/shared/src/index.ts` (or appropriate barrel export)
- [x] 1.3 Add unit tests for the shared function: normal case, zero income, expenses exceed income, edge cases

## 2. Mobile Budget Calculation

- [x] 2.1 In `apps/mobile/hooks/use-settings.ts`, add logic to `updateSetting` so that when `total_monthly_income` or `total_fixed_expenses` changes, it recalculates `calculated_daily_limit` using the shared function and persists it in the same DB transaction
- [x] 2.2 Ensure the recalculated value is included in the sync queue payload (already happens since the full row is re-read and enqueued — verify this)
- [x] 2.3 Handle partial data: only recalculate when BOTH income and fixed expenses are non-null

## 3. Editable Daily Limit on Mobile

- [x] 3.1 In `apps/mobile/components/settings/budget-settings.tsx`, add a "Daily Limit" text input that reads/writes `default_daily_limit` via `updateSetting`
- [x] 3.2 Add helper text explaining precedence: "Used when no income/expenses are set. Calculated limit takes priority when available."
- [x] 3.3 Style the input to match existing income/expenses fields

## 4. Simple Tracking UI Cleanup

- [x] 4.1 In `apps/mobile/components/dashboard/hero-daily-card.tsx`, wrap the progress bar section (the track, the filled bar, and the ₱0/₱limit labels) in a conditional that only renders when `isBudgetMode` is true
- [x] 4.2 Verify the status badge is already hidden in simple mode (it is — `statusBadge` is null when `!isBudgetMode`)
- [x] 4.3 Verify subtitle text shows "spent today" in simple mode (it does — confirm no regression)

## 5. Verification

- [ ] 5.1 Test budget mode: enter income + expenses → verify calculated_daily_limit updates → verify hero card shows correct remaining
- [ ] 5.2 Test simple tracking mode: switch to tracking_only → verify hero card hides progress bar and limit labels
- [ ] 5.3 Test manual daily limit: set a value → clear income/expenses → verify fallback to manual limit
- [x] 5.4 Build check: run `pnpm --filter shared build` and `pnpm --filter mobile build` (or Expo bundler) to confirm no type/import errors
