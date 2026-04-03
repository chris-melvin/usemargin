## ADDED Requirements

### Requirement: Auto-recalculate daily limit when budget inputs change
When a user updates `total_monthly_income` or `total_fixed_expenses` in mobile BudgetSettings, the system SHALL recalculate `calculated_daily_limit` using the formula `floor((income - fixedExpenses) / daysInCurrentMonth)` and persist it to the local database and sync queue.

#### Scenario: User updates monthly income
- **WHEN** user changes monthly income to 50000 with fixed expenses at 20000 in a 30-day month
- **THEN** `calculated_daily_limit` SHALL be set to `floor((50000 - 20000) / 30)` = 1000

#### Scenario: User updates fixed expenses
- **WHEN** user changes fixed expenses to 30000 with income at 50000 in a 30-day month
- **THEN** `calculated_daily_limit` SHALL be set to `floor((50000 - 30000) / 30)` = 666

#### Scenario: Fixed expenses exceed income
- **WHEN** user enters fixed expenses of 60000 with income of 50000
- **THEN** `calculated_daily_limit` SHALL be set to 0 (not negative)

#### Scenario: Income or expenses not yet set
- **WHEN** user enters only income (fixed expenses is null) or only fixed expenses (income is null)
- **THEN** `calculated_daily_limit` SHALL remain unchanged (do not recalculate with partial data)

### Requirement: Shared calculation function
The daily limit formula SHALL be implemented in `@repo/shared` as a pure function so both web and mobile platforms use the same calculation logic.

#### Scenario: Shared function produces consistent results
- **WHEN** `calculateSimpleDailyLimit(50000, 20000, 30)` is called from either web or mobile
- **THEN** the result SHALL be 1000

#### Scenario: Shared function handles zero income
- **WHEN** `calculateSimpleDailyLimit(0, 0, 30)` is called
- **THEN** the result SHALL be 0

### Requirement: Editable default daily limit on mobile
The mobile BudgetSettings screen SHALL include a text input allowing users to directly set `default_daily_limit`, matching the web settings experience.

#### Scenario: User sets manual daily limit
- **WHEN** user enters 500 in the daily limit field and blurs the input
- **THEN** `default_daily_limit` SHALL be updated to 500 in the database and sync queue

#### Scenario: Manual limit used as fallback
- **WHEN** `calculated_daily_limit` is null and `default_daily_limit` is 500
- **THEN** the dashboard SHALL use 500 as the daily limit

#### Scenario: Calculated limit takes precedence
- **WHEN** `calculated_daily_limit` is 1000 and `default_daily_limit` is 500
- **THEN** the dashboard SHALL use 1000 as the daily limit

### Requirement: Recalculation persists and syncs
When `calculated_daily_limit` is recalculated, the updated value SHALL be written to the local SQLite database and enqueued in the sync queue for server synchronization.

#### Scenario: Recalculated value syncs to server
- **WHEN** user updates income triggering a recalculation
- **THEN** the sync queue SHALL contain an update operation for `user_settings` with the new `calculated_daily_limit` value
