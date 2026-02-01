# Timestamp Migration Implementation Checklist

Quick reference for completing the timestamp migration. Use this alongside TIMESTAMP_MIGRATION.md for detailed context.

## Installation

```bash
cd apps/web && npm install
```

This installs the `date-fns-tz` dependency that was added.

## Database Migration

### Before Running

1. **Backup database**:
```bash
# Using psql
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Or using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

2. **Test on staging first**

### Running Migration

```bash
# Apply migration
psql $DATABASE_URL -f packages/database/migrations/0016_full_timestamp_migration.sql
```

### Verification

```bash
# Check for remaining DATE columns (should be empty)
psql $DATABASE_URL -c "
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE data_type = 'date'
AND table_schema = 'public'
AND table_name NOT LIKE 'pg_%';"

# Verify new indexes
psql $DATABASE_URL -c "
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%timestamp%';"
```

## Integration - Add Timezone Provider to App

### Step 1: Update Layout

File: `apps/web/app/dashboard/layout.tsx` (or wherever your root layout is)

```typescript
import { TimezoneProvider } from "@/components/providers";
import { createClient } from "@/lib/supabase/server";

export default async function Layout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load user settings
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("timezone")
    .eq("user_id", user.id)
    .single();

  const timezone = userSettings?.timezone ?? "UTC";

  return (
    <TimezoneProvider initialTimezone={timezone}>
      {children}
    </TimezoneProvider>
  );
}
```

## Remaining Work - Copy/Paste Templates

### Template 1: Update Server Action

```typescript
// File: actions/[entity]/[action].ts

// ADD THIS IMPORT
import * as dateUtils from "@/lib/utils/date";

// BEFORE
export async function createThing(data: {
  date: string;
  // ...
}) {
  const result = await repository.create(supabase, {
    user_id: userId,
    date: data.date,
    // ...
  });
}

// AFTER
export async function createThing(data: {
  timestamp: string;  // Changed from date
  // ...
}) {
  // Validate it's a proper timestamp
  const validation = schema.safeParse(data);

  const result = await repository.create(supabase, {
    user_id: userId,
    [timestamp_field]: data.timestamp,  // Use appropriate field name
    // ...
  });
}
```

### Template 2: Update Hook

```typescript
// File: hooks/use-[entity].ts

// ADD THESE IMPORTS
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

export function useMyHook() {
  // ADD THIS
  const { timezone } = useTimezone();

  // BEFORE
  const { data } = useSWR(
    ["expenses", startDate, endDate],
    () => repository.findByDateRange(supabase, userId, startDate, endDate)
  );

  // AFTER
  const { data } = useSWR(
    ["expenses", startDate, endDate, timezone],  // Add timezone to key
    () => repository.findByDateRange(supabase, userId, startDate, endDate, timezone)  // Pass timezone
  );

  // For optimistic updates, update timestamp instead of date
  mutate((current) => {
    return current.map((item) =>
      item.id === id
        ? { ...item, occurred_at: newTimestamp }  // Not 'date'
        : item
    );
  });
}
```

### Template 3: Update Display Component

```typescript
// File: components/[entity]/[component].tsx

// ADD THESE IMPORTS
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

export function MyComponent({ item }) {
  // ADD THIS
  const { timezone } = useTimezone();

  // BEFORE
  const displayDate = new Date(item.date).toLocaleDateString();

  // AFTER
  const displayDate = dateUtils.formatDate(
    item.occurred_at,  // or appropriate timestamp field
    timezone,
    dateUtils.DATE_FORMATS.MEDIUM
  );

  return <div>{displayDate}</div>;
}
```

### Template 4: Update Form Component

```typescript
// File: components/[entity]/[form].tsx

// ADD THESE IMPORTS
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

export function MyForm() {
  const { timezone } = useTimezone();

  // BEFORE
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    createThing({ date, ... });
  };

  // AFTER
  const [selectedDate, setSelectedDate] = useState(
    dateUtils.getCurrentDateString(timezone)
  );

  const handleSubmit = () => {
    // Convert selected date to timestamp
    const timestamp = dateUtils.fromDateString(selectedDate, timezone);
    createThing({ occurred_at: timestamp, ... });  // Use timestamp
  };
}
```

### Template 5: Update Repository Call

```typescript
// BEFORE
const expenses = await expenseRepository.findByDateRange(
  supabase,
  userId,
  "2024-01-01",
  "2024-01-31"
);

// AFTER
const expenses = await expenseRepository.findByDateRange(
  supabase,
  userId,
  "2024-01-01",
  "2024-01-31",
  timezone  // Add timezone parameter
);
```

## Priority Order

### 1. Critical Server Actions (Do First)

Files in `apps/web/actions/`:

```bash
# Income actions
actions/income/create.ts
actions/income/update.ts
actions/income/mark-received.ts

# Bill actions
actions/bills/create.ts
actions/bills/update.ts
actions/bills/mark-paid.ts
actions/bills/record-payment.ts

# Flex bucket actions
actions/flex-bucket/create-allocation.ts
actions/flex-bucket/create-override.ts

# Budget actions
actions/budget/calculate.ts
actions/budget/update-daily-limit.ts
```

### 2. Critical Hooks (Do Second)

Files in `apps/web/hooks/`:

```bash
hooks/use-server-expenses.ts
hooks/use-server-budget.ts
hooks/use-bills.ts
hooks/use-timeframe.ts
hooks/use-calendar.ts
hooks/use-spending-heatmap.ts
```

### 3. Critical Components (Do Third)

Files in `apps/web/components/`:

```bash
# Calendar
components/calendar/calendar-grid.tsx
components/calendar/calendar-day.tsx

# Forms
components/expenses/expense-form.tsx
components/expenses/quick-add-expense.tsx

# Display
components/day-detail/day-detail-panel.tsx
components/dashboard/dashboard-view.tsx
```

## Field Name Reference

Quick reference for field name changes:

| Old Field Name | New Field Name | Tables |
|---|---|---|
| `date` | `occurred_at` | `expenses` |
| `date` | `allocated_timestamp` | `flex_allocations` |
| `date` | `override_timestamp` | `daily_overrides` |
| `date` | `transaction_timestamp` | `savings_transactions` |
| `date` | `snapshot_timestamp` | `net_worth_snapshots` |
| `start_date` | `start_timestamp` | `incomes`, `debts` |
| `end_date` | `end_timestamp` | `incomes`, `debts` |
| `expected_date` | `expected_timestamp` | `incomes` |
| `received_date` | `received_timestamp` | `incomes` |
| `paid_date` | `paid_timestamp` | `debts` |
| `receive_date` | `receive_timestamp` | `debts` |
| `payment_date` | `payment_timestamp` | `debt_payments` |
| `period_start` | `period_start_timestamp` | `debt_payments` |
| `period_end` | `period_end_timestamp` | `debt_payments` |
| `next_occurrence` | `next_occurrence_timestamp` | `recurring_expenses` |
| `target_date` | `target_timestamp` | `savings_goals` |
| `time_of_day` | **REMOVED** | `expenses` (use occurred_at) |

## Search & Replace Patterns

### Find files that need updating:

```bash
# Find date operations
grep -r "\.date" apps/web/components apps/web/hooks apps/web/actions --include="*.tsx" --include="*.ts"

# Find time_of_day references
grep -r "time_of_day" apps/web/ --include="*.tsx" --include="*.ts"

# Find date splitting
grep -r "split(\"T\")\[0\]" apps/web/ --include="*.tsx" --include="*.ts"

# Find direct Date() usage
grep -r "new Date()" apps/web/ --include="*.tsx" --include="*.ts" --exclude-dir=node_modules
```

## Testing Commands

```bash
# Type checking
npm run check-types

# Linting
npm run lint

# Unit tests
npm run test

# Build
npm run build
```

## Verification After Completion

Run these checks after completing the migration:

```bash
# 1. No deprecated patterns
grep -r "time_of_day" apps/web/ --include="*.tsx" --include="*.ts"
# Should return: no results

grep -r "\.split\(\"T\"\)\[0\]" apps/web/ --include="*.tsx" --include="*.ts"
# Should return: no results

# 2. dateUtils is used
grep -rc "dateUtils\." apps/web/ --include="*.tsx" --include="*.ts" | grep -v ":0"
# Should return: many files with usage

# 3. Timezone provider is used
grep -rc "useTimezone" apps/web/components --include="*.tsx" | grep -v ":0"
# Should return: many components using it
```

## Common Gotchas

### 1. Don't forget timezone in hooks

```typescript
// WRONG - Missing timezone in dependency array
useSWR(["expenses", startDate], () => fetch(startDate))

// RIGHT - Include timezone
useSWR(["expenses", startDate, timezone], () => fetch(startDate, timezone))
```

### 2. Always convert user input to timestamps

```typescript
// WRONG - Sending date string
createExpense({ date: "2024-01-15" })

// RIGHT - Convert to timestamp first
const timestamp = dateUtils.fromDateString("2024-01-15", timezone);
createExpense({ occurred_at: timestamp })
```

### 3. Use timezone for comparisons

```typescript
// WRONG - Direct string comparison
if (expense.occurred_at === "2024-01-15") { }

// RIGHT - Use dateUtils
if (dateUtils.isSameDay(expense.occurred_at, targetTimestamp, timezone)) { }
```

## Quick Links

- [Full Migration Guide](./TIMESTAMP_MIGRATION.md)
- [Date Utilities API](./DATE_UTILITIES.md)
- [Date Utils Source](../apps/web/lib/utils/date.ts)
- [Base Financial Repository](../apps/web/lib/repositories/base-financial.repository.ts)
- [Timezone Provider](../apps/web/components/providers/timezone-provider.tsx)

## Need Help?

1. Check the completed files for examples:
   - `apps/web/lib/repositories/expense.repository.ts`
   - `apps/web/actions/expenses/create.ts`
   - Reference pattern implementations

2. Check documentation:
   - [TIMESTAMP_MIGRATION.md](./TIMESTAMP_MIGRATION.md) - Full context
   - [DATE_UTILITIES.md](./DATE_UTILITIES.md) - API reference

3. Common patterns are in DATE_UTILITIES.md under "Common Patterns" section
