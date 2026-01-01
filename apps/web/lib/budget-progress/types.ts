/**
 * Budget Progress Types
 *
 * Types for tracking daily, weekly, and monthly budget progress
 * including rollover calculations and positive messaging.
 */

/**
 * Daily budget status for a single day
 */
export interface DailyBudgetStatus {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Daily spending limit for this day */
  limit: number;
  /** Total amount spent on this day */
  spent: number;
  /** Remaining budget (limit - spent), can be negative if over */
  remaining: number;
  /** Accumulated savings from previous days (rollover) */
  rollover: number;
  /** Effective limit including rollover (limit + rollover from yesterday) */
  effectiveLimit: number;
}

/**
 * Weekly progress summary
 */
export interface WeeklyProgress {
  /** Start of the week (YYYY-MM-DD) */
  weekStart: string;
  /** End of the week (YYYY-MM-DD) */
  weekEnd: string;
  /** Total budget for the week (sum of daily limits) */
  totalBudget: number;
  /** Total spent during the week */
  totalSpent: number;
  /** Remaining budget for the week */
  remaining: number;
  /** Percentage of budget used (0-100+) */
  percentUsed: number;
  /** Number of days tracked in this week */
  daysTracked: number;
  /** Breakdown by day */
  dailyBreakdown: DailyBudgetStatus[];
}

/**
 * Monthly progress summary
 */
export interface MonthlyProgress {
  /** Start of the month (YYYY-MM-DD) */
  monthStart: string;
  /** End of the month (YYYY-MM-DD) */
  monthEnd: string;
  /** Total budget for the month (sum of daily limits) */
  totalBudget: number;
  /** Total spent so far this month */
  totalSpent: number;
  /** Expected spent based on days elapsed */
  expectedSpentToDate: number;
  /** Ahead/behind amount (positive = ahead, negative = behind) */
  aheadBehindAmount: number;
  /** Projected spending by end of month at current rate */
  projectedEndOfMonth: number;
  /** Total rollover accumulated this month */
  rolloverAccumulated: number;
  /** Number of days elapsed in the month */
  daysElapsed: number;
  /** Total days in the month */
  totalDays: number;
}

/**
 * Today's status with contextual info
 */
export interface TodayStatus {
  /** Today's date */
  date: string;
  /** Base daily limit */
  dailyLimit: number;
  /** Amount spent today */
  spent: number;
  /** Remaining today (dailyLimit - spent) */
  remaining: number;
  /** Rollover from yesterday */
  rolloverFromYesterday: number;
  /** Effective limit (dailyLimit + rollover) */
  effectiveLimit: number;
  /** Whether over budget */
  isOver: boolean;
  /** Amount saved today (if under budget) */
  savedToday: number;
}

/**
 * Positive message for user encouragement
 */
export interface PositiveMessage {
  type:
    | "under_budget"
    | "streak"
    | "weekly_ahead"
    | "monthly_ahead"
    | "rollover_growing";
  message: string;
  amount?: number;
  days?: number;
}
