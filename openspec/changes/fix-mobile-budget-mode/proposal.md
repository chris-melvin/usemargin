## Why

Budget mode on mobile is fundamentally broken: when users enter income and fixed expenses, the daily limit is never recalculated — it stays at the hardcoded default (300) or whatever was last synced from web. Additionally, there's no way to manually set a daily limit on mobile (web has this), and simple tracking mode still renders budget-specific UI elements (progress bar, limit labels) that confuse users who opted out of budgeting.

## What Changes

- **Add budget calculation logic to mobile**: When income or fixed expenses change in mobile BudgetSettings, recompute `calculated_daily_limit` using `(income - fixedExpenses) / daysInMonth` and persist it
- **Add editable daily limit field**: Allow users to manually set `default_daily_limit` directly in mobile BudgetSettings, matching the web experience
- **Adapt HeroDailyCard for tracking-only mode**: Hide the progress bar, limit labels, and limit-based subtitle when `tracking_mode === "tracking_only"` — show only total spent
- **Recalculate on month boundaries**: When the month changes, days-in-month changes, so the calculated limit should update

## Capabilities

### New Capabilities
- `mobile-budget-calculation`: Computes and persists `calculated_daily_limit` on mobile when budget inputs change
- `mobile-simple-tracking-ui`: Adapts the hero card and dashboard to render a simplified view when in tracking-only mode (no progress bar, no limit references)

### Modified Capabilities

_(No existing specs to modify — specs directory is empty)_

## Impact

- **Files modified**:
  - `apps/mobile/components/settings/budget-settings.tsx` — add calculation logic + editable limit field
  - `apps/mobile/hooks/use-settings.ts` — add `recalculateDailyLimit` helper or extend `updateSetting`
  - `apps/mobile/components/dashboard/hero-daily-card.tsx` — conditional rendering for tracking-only mode
  - `apps/mobile/app/(tabs)/index.tsx` — adjust props passed to HeroDailyCard based on mode
- **Shared code**: May extract the daily limit formula into `@repo/shared` so web and mobile use the same calculation
- **Sync**: `calculated_daily_limit` already syncs via entity-registry — no sync changes needed
- **No new dependencies or API changes**
