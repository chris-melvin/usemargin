"use client";

import { useMemo } from "react";
import { formatKey } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";
import type { LocalExpense } from "@/lib/types";

interface UseCalendarOptions {
  dailyLimit?: number;
}

export function useCalendar(
  expenses: LocalExpense[],
  options: UseCalendarOptions = {}
) {
  const { dailyLimit = DEFAULT_DAILY_LIMIT } = options;

  const todayStatus = useMemo(() => {
    const today = new Date();
    const todayKey = formatKey(today);

    const todayExpenses = expenses.filter(
      (e) => formatKey(new Date(e.date)) === todayKey
    );
    const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = dailyLimit - spent;

    return {
      spent,
      remaining,
      limit: dailyLimit,
      isOver: remaining < 0,
    };
  }, [expenses, dailyLimit]);

  return {
    todayStatus,
  };
}
