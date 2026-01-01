"use client";

import { useMemo } from "react";
import {
  calculateTodayStatus,
  calculateWeeklyProgress,
  calculateMonthlyProgress,
  getPositiveMessage,
} from "@/lib/budget-progress/calculations";
import type {
  TodayStatus,
  WeeklyProgress,
  MonthlyProgress,
  PositiveMessage,
} from "@/lib/budget-progress/types";

/**
 * Minimal expense interface for budget calculations
 */
interface ExpenseForBudget {
  date: string;
  amount: number;
}

interface UseBudgetProgressOptions {
  dailyLimit: number;
  weekStartsOn?: number; // 0 = Sunday, 1 = Monday (default)
}

interface BudgetProgress {
  todayStatus: TodayStatus;
  weeklyProgress: WeeklyProgress;
  monthlyProgress: MonthlyProgress;
  positiveMessage: PositiveMessage | null;
  effectiveDailyLimit: number;
  rolloverAmount: number;
}

/**
 * Hook to calculate budget progress from expenses
 */
export function useBudgetProgress(
  expenses: ExpenseForBudget[],
  options: UseBudgetProgressOptions
): BudgetProgress {
  const { dailyLimit, weekStartsOn = 1 } = options;

  return useMemo(() => {
    // Build a map of date -> total spent
    const dailyTotals = new Map<string, number>();

    for (const expense of expenses) {
      const current = dailyTotals.get(expense.date) ?? 0;
      dailyTotals.set(expense.date, current + expense.amount);
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // Calculate all progress metrics
    const todayStatus = calculateTodayStatus(dailyTotals, dailyLimit, today);
    const weeklyProgress = calculateWeeklyProgress(
      dailyTotals,
      dailyLimit,
      today,
      weekStartsOn
    );
    const monthlyProgress = calculateMonthlyProgress(
      dailyTotals,
      dailyLimit,
      year,
      month
    );

    // Get positive message based on status
    const positiveMessage = getPositiveMessage(
      todayStatus,
      weeklyProgress,
      monthlyProgress
    );

    return {
      todayStatus,
      weeklyProgress,
      monthlyProgress,
      positiveMessage,
      effectiveDailyLimit: todayStatus.effectiveLimit,
      rolloverAmount: todayStatus.rolloverFromYesterday,
    };
  }, [expenses, dailyLimit, weekStartsOn]);
}
