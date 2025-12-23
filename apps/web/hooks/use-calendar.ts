"use client";

import { useMemo } from "react";
import { formatKey } from "@/lib/utils";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";
import type { LocalExpense } from "@/lib/types";

export function useCalendar(expenses: LocalExpense[]) {
  const todayStatus = useMemo(() => {
    const today = new Date();
    const todayKey = formatKey(today);

    const todayExpenses = expenses.filter(
      (e) => formatKey(new Date(e.date)) === todayKey
    );
    const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = DEFAULT_DAILY_LIMIT - spent;

    return {
      spent,
      remaining,
      limit: DEFAULT_DAILY_LIMIT,
      isOver: remaining < 0,
    };
  }, [expenses]);

  return {
    todayStatus,
  };
}
