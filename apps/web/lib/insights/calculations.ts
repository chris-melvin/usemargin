import * as dateUtils from "@/lib/utils/date";
import type { Expense } from "@repo/database";
import type {
  DailySpending,
  CategoryTotal,
  DayOfWeekSpending,
  StreakInfo,
  PeriodTotals,
  InsightsPeriod,
  MonthComparison,
  WeekdayWeekendSplit,
  RollingAveragePoint,
} from "./types";

const CATEGORY_COLORS = [
  "#1A9E9E", // teal
  "#E87356", // coral
  "#D4A843", // gold
  "#4A90D9", // blue
  "#5CB85C", // green
  "#8E6CB8", // purple
  "#D97BA0", // pink
  "#8C8C8C", // neutral
];

export function computeDailySpending(
  expenses: Expense[],
  timezone: string,
  days: number
): DailySpending[] {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");

  // Build start/end timestamps
  const endTimestamp = dateUtils.getCurrentTimestamp(timezone, true);
  const startTimestamp = dateUtils.subtractDaysFromTimestamp(
    endTimestamp,
    days - 1,
    timezone
  );

  const dayKeys = dateUtils.getEachDayInInterval(startTimestamp, endTimestamp, timezone);

  // Group expenses by date key
  const spendByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    spendByDay.set(key, (spendByDay.get(key) ?? 0) + expense.amount);
  }

  return dayKeys.map((date) => ({
    date,
    amount: spendByDay.get(date) ?? 0,
    isToday: date === todayStr,
    overBudget: false, // will be set by caller if budget mode
  }));
}

export function computeCategoryBreakdown(
  expenses: Expense[]
): CategoryTotal[] {
  const categoryMap = new Map<string, number>();
  for (const expense of expenses) {
    const cat = expense.category || "Uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + expense.amount);
  }

  // Sort descending by amount
  const sorted = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1]);

  const total = sorted.reduce((sum, [, amt]) => sum + amt, 0);

  // Group excess into "Other" if more than 6 categories
  let entries = sorted;
  if (sorted.length > 6) {
    const top6 = sorted.slice(0, 6);
    const otherAmount = sorted.slice(6).reduce((sum, [, amt]) => sum + amt, 0);
    entries = [...top6, ["Other", otherAmount] as [string, number]];
  }

  return entries.map(([category, amount], i) => ({
    category,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
  }));
}

export function computeDayOfWeekSpending(
  expenses: Expense[],
  timezone: string
): DayOfWeekSpending[] {
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  // Track totals and unique dates per weekday
  const dayTotals = Array.from({ length: 7 }, () => 0);
  const dayDates = Array.from({ length: 7 }, () => new Set<string>());

  for (const expense of expenses) {
    const date = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    const dayOfWeek = new Date(date + "T12:00:00").getDay(); // noon to avoid DST issues
    dayTotals[dayOfWeek]! += expense.amount;
    dayDates[dayOfWeek]!.add(date);
  }

  return DAY_LABELS.map((label, i) => {
    const totalDays = Math.max(dayDates[i]!.size, 1);
    return {
      dayIndex: i,
      dayLabel: label,
      average: dayTotals[i]! / totalDays,
      totalDays: dayDates[i]!.size,
    };
  });
}

export function computeStreaks(
  expenses: Expense[],
  timezone: string,
  dailyLimit: number,
  isBudgetMode: boolean
): StreakInfo {
  const type = isBudgetMode ? "under_budget" : "tracking";

  // Build a map of date -> total spending
  const spendByDay = new Map<string, number>();
  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    spendByDay.set(key, (spendByDay.get(key) ?? 0) + expense.amount);
  }

  const todayStr = dateUtils.formatInTimezone(new Date(), timezone, "yyyy-MM-dd");

  // Walk backwards from today counting consecutive streak days
  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Check up to 90 days back
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(todayStr + "T12:00:00");
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = dateUtils.formatInTimezone(checkDate, timezone, "yyyy-MM-dd");
    const spent = spendByDay.get(dateKey) ?? 0;

    const passes = isBudgetMode ? spent <= dailyLimit : spent > 0;

    if (passes) {
      tempStreak++;
      if (i < 90) {
        // still building current streak
        current = tempStreak;
      }
    } else {
      if (i === 0) {
        // Today broke the streak, current is 0
        current = 0;
      }
      break;
    }
  }

  longest = current;

  // Continue scanning for longest streak
  let scanning = false;
  tempStreak = 0;
  for (let i = 0; i < 90; i++) {
    const checkDate = new Date(todayStr + "T12:00:00");
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = dateUtils.formatInTimezone(checkDate, timezone, "yyyy-MM-dd");
    const spent = spendByDay.get(dateKey) ?? 0;

    const passes = isBudgetMode ? spent <= dailyLimit : spent > 0;

    if (passes) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 0;
      scanning = true;
    }
  }

  return { current, longest, type };
}

export function computePeriodTotals(
  expenses: Expense[],
  period: InsightsPeriod,
  timezone: string,
  days: number
): PeriodTotals {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avg = days > 0 ? Math.round(total / days) : 0;

  const now = new Date();
  const periodLabel =
    period === "week"
      ? "This Week"
      : dateUtils.formatInTimezone(now, timezone, "MMMM");

  return { total, avg, periodLabel };
}

export function computeMonthComparison(
  expenses: Expense[],
  timezone: string
): MonthComparison | null {
  const now = new Date();
  const todayStr = dateUtils.formatInTimezone(now, timezone, "yyyy-MM-dd");
  const currentMonthStart = dateUtils.getStartOfMonth(now.toISOString(), timezone);
  const currentMonthStartStr = dateUtils.formatInTimezone(
    new Date(currentMonthStart),
    timezone,
    "yyyy-MM-dd"
  );

  // Days elapsed in current month (inclusive of today)
  const currentDays =
    Math.floor(
      (new Date(todayStr + "T12:00:00").getTime() -
        new Date(currentMonthStartStr + "T12:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  // Previous month: same number of days from start
  const prevMonthStart = dateUtils.subtractMonthsFromTimestamp(
    currentMonthStart,
    1,
    timezone
  );
  const prevMonthStartStr = dateUtils.formatInTimezone(
    new Date(prevMonthStart),
    timezone,
    "yyyy-MM-dd"
  );
  const prevEndDate = new Date(prevMonthStartStr + "T12:00:00");
  prevEndDate.setDate(prevEndDate.getDate() + currentDays - 1);
  const prevEndStr = dateUtils.formatInTimezone(prevEndDate, timezone, "yyyy-MM-dd");

  // Filter expenses into each window
  let currentTotal = 0;
  let previousTotal = 0;
  let hasPrevData = false;

  for (const expense of expenses) {
    const key = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    if (key >= currentMonthStartStr && key <= todayStr) {
      currentTotal += expense.amount;
    }
    if (key >= prevMonthStartStr && key <= prevEndStr) {
      previousTotal += expense.amount;
      hasPrevData = true;
    }
  }

  if (!hasPrevData) return null;

  const delta = currentTotal - previousTotal;
  const percentChange =
    previousTotal > 0 ? Math.round((delta / previousTotal) * 100) : 0;

  const currentMonthLabel = dateUtils.formatInTimezone(now, timezone, "MMMM");
  const previousMonthLabel = dateUtils.formatInTimezone(
    new Date(prevMonthStart),
    timezone,
    "MMMM"
  );

  return {
    currentTotal,
    previousTotal,
    currentDays,
    previousDays: currentDays,
    delta,
    percentChange,
    currentMonthLabel,
    previousMonthLabel,
  };
}

export function computeRollingAverage(
  dailySpending: DailySpending[],
  windowSize: number = 7
): RollingAveragePoint[] {
  return dailySpending.map((day, i) => {
    if (i < windowSize - 1) {
      return { date: day.date, average: null };
    }
    let sum = 0;
    for (let j = i - windowSize + 1; j <= i; j++) {
      sum += dailySpending[j]!.amount;
    }
    return { date: day.date, average: Math.round(sum / windowSize) };
  });
}

export function computeWeekdayWeekendSplit(
  expenses: Expense[],
  timezone: string
): WeekdayWeekendSplit {
  const weekdayDates = new Set<string>();
  const weekendDates = new Set<string>();
  let weekdayTotal = 0;
  let weekendTotal = 0;

  for (const expense of expenses) {
    const dateStr = dateUtils.formatInTimezone(
      new Date(expense.occurred_at),
      timezone,
      "yyyy-MM-dd"
    );
    const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      weekendTotal += expense.amount;
      weekendDates.add(dateStr);
    } else {
      weekdayTotal += expense.amount;
      weekdayDates.add(dateStr);
    }
  }

  const weekdayDays = Math.max(weekdayDates.size, 1);
  const weekendDays = Math.max(weekendDates.size, 1);
  const weekdayAvg = Math.round(weekdayTotal / weekdayDays);
  const weekendAvg = Math.round(weekendTotal / weekendDays);

  let higherOn: "weekday" | "weekend" | "equal";
  let percentDiff: number;
  if (weekdayAvg === weekendAvg) {
    higherOn = "equal";
    percentDiff = 0;
  } else if (weekendAvg > weekdayAvg) {
    higherOn = "weekend";
    percentDiff =
      weekdayAvg > 0 ? Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100) : 100;
  } else {
    higherOn = "weekday";
    percentDiff =
      weekendAvg > 0 ? Math.round(((weekdayAvg - weekendAvg) / weekendAvg) * 100) : 100;
  }

  return {
    weekdayAvg,
    weekendAvg,
    weekdayTotal,
    weekendTotal,
    weekdayDays: weekdayDates.size,
    weekendDays: weekendDates.size,
    higherOn,
    percentDiff,
  };
}
