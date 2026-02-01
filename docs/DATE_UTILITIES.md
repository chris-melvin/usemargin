# Date Utilities API Reference

Complete API reference for the centralized date utilities in `apps/web/lib/utils/date.ts`.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Conversion Functions](#conversion-functions)
- [Formatting Functions](#formatting-functions)
- [Date Calculation Functions](#date-calculation-functions)
- [Comparison Functions](#comparison-functions)
- [Range Functions](#range-functions)
- [Helper Functions](#helper-functions)
- [Common Patterns](#common-patterns)

## Core Concepts

### Timezone Awareness

All functions in this library are timezone-aware. Key principles:

1. **Storage**: All dates stored as UTC timestamps (ISO 8601)
2. **Display**: All dates displayed in user's local timezone
3. **Queries**: Date range queries convert to UTC for database

### Default Timezone

```typescript
export const DEFAULT_TIMEZONE = "UTC";
```

When no timezone is specified, operations default to UTC.

### Date Formats

Pre-defined format constants:

```typescript
DATE_FORMATS.SHORT         // "MMM d, yyyy" → "Jan 1, 2024"
DATE_FORMATS.MEDIUM        // "MMMM d, yyyy" → "January 1, 2024"
DATE_FORMATS.LONG          // "EEEE, MMMM d, yyyy" → "Monday, January 1, 2024"
DATE_FORMATS.ISO_DATE      // "yyyy-MM-dd" → "2024-01-01"
DATE_FORMATS.TIME_12H      // "h:mm a" → "1:30 PM"
DATE_FORMATS.TIME_24H      // "HH:mm" → "13:30"
DATE_FORMATS.DATETIME_SHORT // "MMM d, h:mm a" → "Jan 1, 1:30 PM"
DATE_FORMATS.MONTH_YEAR    // "MMMM yyyy" → "January 2024"
```

## Conversion Functions

### toTimestamp()

Converts any date input to a UTC timestamp string.

```typescript
function toTimestamp(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE
): string
```

**Examples**:
```typescript
// User in New York selects "2024-01-15"
toTimestamp("2024-01-15", "America/New_York")
// Returns: "2024-01-15T05:00:00.000Z" (midnight in NY = 5am UTC)

// Convert Date object
toTimestamp(new Date("2024-01-15"), "America/New_York")
// Returns: "2024-01-15T05:00:00.000Z"

// ISO timestamp passes through
toTimestamp("2024-01-15T10:00:00Z", "America/New_York")
// Returns: "2024-01-15T10:00:00.000Z"
```

### toUserDate()

Converts a UTC timestamp to a Date object in user's timezone.

```typescript
function toUserDate(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): Date
```

**Examples**:
```typescript
toUserDate("2024-01-15T05:00:00.000Z", "America/New_York")
// Returns: Date object representing 2024-01-15 00:00:00 in NY
```

### fromDateString()

Parses a date string (YYYY-MM-DD) into a timestamp at midnight in user's timezone.

```typescript
function fromDateString(
  dateString: string,
  timezone: string = DEFAULT_TIMEZONE
): string
```

**Examples**:
```typescript
fromDateString("2024-01-15", "America/New_York")
// Returns: "2024-01-15T05:00:00.000Z"
```

### toDateString()

Converts a timestamp to a date string (YYYY-MM-DD) in user's timezone.

```typescript
function toDateString(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string
```

**Examples**:
```typescript
toDateString("2024-01-15T05:00:00.000Z", "America/New_York")
// Returns: "2024-01-15"
```

## Formatting Functions

### formatDate()

Formats a timestamp for display in user's timezone.

```typescript
function formatDate(
  timestamp: string,
  timezone: string = DEFAULT_TIMEZONE,
  formatString: string = DATE_FORMATS.MEDIUM
): string
```

**Examples**:
```typescript
formatDate("2024-01-15T05:00:00.000Z", "America/New_York", DATE_FORMATS.MEDIUM)
// Returns: "January 15, 2024"

formatDate("2024-01-15T05:00:00.000Z", "America/New_York", DATE_FORMATS.SHORT)
// Returns: "Jan 15, 2024"

formatDate("2024-01-15T14:30:00.000Z", "America/New_York", DATE_FORMATS.DATETIME_SHORT)
// Returns: "Jan 15, 9:30 AM"

// Custom format
formatDate("2024-01-15T05:00:00.000Z", "America/New_York", "EEEE")
// Returns: "Monday"
```

## Date Calculation Functions

### getCurrentTimestamp()

Gets the current timestamp, optionally at start of day in user's timezone.

```typescript
function getCurrentTimestamp(
  timezone: string = DEFAULT_TIMEZONE,
  startOfDayInTimezone: boolean = false
): string
```

**Examples**:
```typescript
// Current moment
getCurrentTimestamp()
// Returns: "2024-01-15T14:30:00.000Z"

// Midnight today in NY
getCurrentTimestamp("America/New_York", true)
// Returns: "2024-01-15T05:00:00.000Z"
```

### getTodayTimestamp()

Gets timestamp for start of today in user's timezone.

```typescript
function getTodayTimestamp(timezone: string = DEFAULT_TIMEZONE): string
```

**Examples**:
```typescript
getTodayTimestamp("America/New_York")
// Returns: "2024-01-15T05:00:00.000Z" (if today is Jan 15)
```

### addDaysToTimestamp()

Adds days to a timestamp.

```typescript
function addDaysToTimestamp(
  timestamp: string,
  days: number,
  timezone: string = DEFAULT_TIMEZONE
): string
```

**Examples**:
```typescript
addDaysToTimestamp("2024-01-15T05:00:00.000Z", 7, "America/New_York")
// Returns: "2024-01-22T05:00:00.000Z" (one week later)

addDaysToTimestamp("2024-01-15T05:00:00.000Z", -1, "America/New_York")
// Returns: "2024-01-14T05:00:00.000Z" (one day earlier)
```

### Similar Functions

All follow the same pattern:

```typescript
subtractDaysFromTimestamp(timestamp, days, timezone)
addMonthsToTimestamp(timestamp, months, timezone)
subtractMonthsFromTimestamp(timestamp, months, timezone)
addYearsToTimestamp(timestamp, years, timezone)
addWeeksToTimestamp(timestamp, weeks, timezone)
addQuartersToTimestamp(timestamp, quarters, timezone)
```

### Start/End of Period

Get boundaries of time periods in user's timezone:

```typescript
getStartOfDay(timestamp, timezone)
getEndOfDay(timestamp, timezone)
getStartOfWeek(timestamp, timezone, weekStartsOn = 0)
getEndOfWeek(timestamp, timezone, weekStartsOn = 0)
getStartOfMonth(timestamp, timezone)
getEndOfMonth(timestamp, timezone)
getStartOfYear(timestamp, timezone)
getEndOfYear(timestamp, timezone)
```

**Examples**:
```typescript
// Start of month containing this timestamp
getStartOfMonth("2024-01-15T14:30:00.000Z", "America/New_York")
// Returns: "2024-01-01T05:00:00.000Z" (midnight Jan 1 in NY)

// End of month
getEndOfMonth("2024-01-15T14:30:00.000Z", "America/New_York")
// Returns: "2024-02-01T04:59:59.999Z" (end of Jan 31 in NY)
```

## Comparison Functions

### isSameDay()

Checks if two timestamps are on the same day in user's timezone.

```typescript
function isSameDay(
  timestamp1: string,
  timestamp2: string,
  timezone: string = DEFAULT_TIMEZONE
): boolean
```

**Examples**:
```typescript
isSameDay(
  "2024-01-15T04:00:00.000Z",  // 11pm Jan 14 in NY
  "2024-01-15T06:00:00.000Z",  // 1am Jan 15 in NY
  "America/New_York"
)
// Returns: false (different days in NY)

isSameDay(
  "2024-01-15T10:00:00.000Z",  // 5am Jan 15 in NY
  "2024-01-15T20:00:00.000Z",  // 3pm Jan 15 in NY
  "America/New_York"
)
// Returns: true (same day in NY)
```

### Similar Comparison Functions

```typescript
isSameMonth(timestamp1, timestamp2, timezone)
isSameYear(timestamp1, timestamp2, timezone)
isToday(timestamp, timezone)
isPast(timestamp, timezone)
isFuture(timestamp, timezone)
```

### Timestamp Comparison

```typescript
isAfterTimestamp(timestamp1, timestamp2)  // timestamp1 > timestamp2
isBeforeTimestamp(timestamp1, timestamp2) // timestamp1 < timestamp2
isWithinTimestampInterval(timestamp, start, end)
```

### Difference Functions

```typescript
getDifferenceInDays(timestamp1, timestamp2, timezone)
getDifferenceInMonths(timestamp1, timestamp2, timezone)
getDifferenceInYears(timestamp1, timestamp2, timezone)
```

## Range Functions

### dateRangeToTimestamps()

Converts a date range to UTC timestamps.

```typescript
function dateRangeToTimestamps(
  startDate: Date | string,
  endDate: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
  includeFullDay: boolean = false
): { start: string; end: string }
```

**Examples**:
```typescript
// Month view
dateRangeToTimestamps("2024-01-01", "2024-01-31", "America/New_York", true)
// Returns: {
//   start: "2024-01-01T05:00:00.000Z",  // midnight Jan 1 in NY
//   end: "2024-02-01T04:59:59.999Z"     // end of Jan 31 in NY
// }

// Day view (without full day)
dateRangeToTimestamps("2024-01-15", "2024-01-15", "America/New_York", false)
// Returns: {
//   start: "2024-01-15T05:00:00.000Z",  // midnight Jan 15
//   end: "2024-01-15T05:00:00.000Z"     // midnight Jan 15
// }
```

### getEachDayInInterval()

Gets array of all days in a timestamp range.

```typescript
function getEachDayInInterval(
  startTimestamp: string,
  endTimestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string[]  // Array of YYYY-MM-DD strings
```

**Examples**:
```typescript
const { start, end } = dateRangeToTimestamps(
  "2024-01-01",
  "2024-01-03",
  "America/New_York",
  true
);
getEachDayInInterval(start, end, "America/New_York")
// Returns: ["2024-01-01", "2024-01-02", "2024-01-03"]
```

### getEachMonthInInterval()

Gets array of all months in a timestamp range.

```typescript
function getEachMonthInInterval(
  startTimestamp: string,
  endTimestamp: string,
  timezone: string = DEFAULT_TIMEZONE
): string[]  // Array of YYYY-MM-DD (first of month)
```

## Helper Functions

### getCurrentDateString()

Get current date string in user's timezone.

```typescript
function getCurrentDateString(timezone: string = DEFAULT_TIMEZONE): string
```

## Common Patterns

### Pattern 1: Display an Expense Date

```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function ExpenseListItem({ expense }) {
  const { timezone } = useTimezone();

  const displayDate = dateUtils.formatDate(
    expense.occurred_at,
    timezone,
    dateUtils.DATE_FORMATS.MEDIUM
  );

  return <div>{displayDate}</div>;
}
```

### Pattern 2: Create an Expense

```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function ExpenseForm() {
  const { timezone } = useTimezone();

  const handleSubmit = (selectedDate: string) => {
    // User selected "2024-01-15" in their calendar
    const timestamp = dateUtils.fromDateString(selectedDate, timezone);

    // Or if you need current time
    const timestamp = dateUtils.getCurrentTimestamp(timezone);

    createExpense({ occurred_at: timestamp, ... });
  };
}
```

### Pattern 3: Query Expenses for a Month

```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function useMonthExpenses(year: number, month: number) {
  const { timezone } = useTimezone();

  // Generate month range
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  // Convert to timestamps
  const { start, end } = dateUtils.dateRangeToTimestamps(
    startDate,
    endDate,
    timezone,
    true
  );

  // Query repository
  return expenseRepository.findByTimestampRange(supabase, userId, start, end);
}
```

### Pattern 4: Group Expenses by Day

```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function groupExpensesByDay(expenses: Expense[], timezone: string) {
  const grouped = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const date = dateUtils.toDateString(expense.occurred_at, timezone);
    const existing = grouped.get(date) ?? [];
    grouped.set(date, [...existing, expense]);
  }

  return grouped;
}
```

### Pattern 5: Check if Expense is Today

```typescript
import { useTimezone } from "@/components/providers";
import * as dateUtils from "@/lib/utils/date";

function ExpenseItem({ expense }) {
  const { timezone } = useTimezone();

  const isToday = dateUtils.isToday(expense.occurred_at, timezone);

  return (
    <div className={isToday ? "highlight" : ""}>
      {/* ... */}
    </div>
  );
}
```

### Pattern 6: Calculate Days Until Due

```typescript
import * as dateUtils from "@/lib/utils/date";

function BillCard({ bill, timezone }) {
  const now = dateUtils.getCurrentTimestamp(timezone);
  const daysUntil = dateUtils.getDifferenceInDays(bill.due_date, now, timezone);

  return <div>Due in {daysUntil} days</div>;
}
```

## Tips

1. **Always pass timezone**: Never omit the timezone parameter when displaying dates
2. **Use dateUtils everywhere**: Replace all direct `new Date()` usage with dateUtils
3. **Store UTC, display local**: Always store UTC in database, convert for display
4. **Test timezones**: Test with different timezones, especially across DST boundaries
5. **Use constants**: Use `DATE_FORMATS` constants instead of magic strings

## Error Handling

All functions will throw if:
- Invalid timestamp format provided
- Invalid timezone name provided
- Invalid date format provided

Wrap in try/catch when dealing with user input:

```typescript
try {
  const timestamp = dateUtils.fromDateString(userInput, timezone);
} catch (error) {
  console.error("Invalid date input:", error);
  // Show error to user
}
```
