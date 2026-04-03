## ADDED Requirements

### Requirement: Hide budget progress elements in simple tracking mode
When `tracking_mode` is `tracking_only`, the HeroDailyCard SHALL NOT render the progress bar, limit labels (₱0 / ₱limit), or status badge. Only the total spent amount and "spent today" subtitle SHALL be displayed.

#### Scenario: Simple tracking mode hides progress bar
- **WHEN** `tracking_mode` is `tracking_only`
- **THEN** the progress bar, the ₱0 label, and the ₱limit label SHALL NOT be rendered

#### Scenario: Simple tracking mode hides status badge
- **WHEN** `tracking_mode` is `tracking_only`
- **THEN** no status badge ("On track", "Over budget", etc.) SHALL be rendered

#### Scenario: Simple tracking mode shows spent amount
- **WHEN** `tracking_mode` is `tracking_only` and user has spent 500 today
- **THEN** the card SHALL display "₱500" with subtitle "spent today"

#### Scenario: Budget mode retains full UI
- **WHEN** `tracking_mode` is `budget_enabled`
- **THEN** the card SHALL render the progress bar, limit labels, status badge, and "remaining" subtitle — no change from current behavior

### Requirement: Dashboard passes correct mode to hero card
The dashboard (index.tsx) SHALL derive `isBudgetMode` from `settings.tracking_mode` and pass it to HeroDailyCard. When in simple tracking mode, budget-specific props (`remaining`, `limit`) MAY still be passed but SHALL NOT affect the rendered output.

#### Scenario: Mode derived from settings
- **WHEN** `settings.tracking_mode` is `tracking_only`
- **THEN** `isBudgetMode` SHALL be `false` when passed to HeroDailyCard

#### Scenario: Mode derived from budget settings
- **WHEN** `settings.tracking_mode` is `budget_enabled`
- **THEN** `isBudgetMode` SHALL be `true` when passed to HeroDailyCard
