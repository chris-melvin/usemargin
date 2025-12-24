"use client";

import { useMemo } from "react";
import type { LocalExpense, HeatmapCell, DateRange } from "@/lib/types";

// Get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface UseSpendingHeatmapProps {
  expenses: LocalExpense[];
  dateRange: DateRange;
}

export function useSpendingHeatmap({
  expenses,
  dateRange,
}: UseSpendingHeatmapProps): HeatmapCell[] {
  return useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    // Create a map of date -> { amount, count }
    const dateMap = new Map<string, { amount: number; count: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0]!;
      dateMap.set(dateKey, { amount: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate expenses by date
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const dateKey = expense.date.split("T")[0]!;
        const existing = dateMap.get(dateKey);
        if (existing) {
          existing.amount += expense.amount;
          existing.count += 1;
        }
      }
    });

    // Convert to HeatmapCell array
    const cells: HeatmapCell[] = [];
    dateMap.forEach((data, dateKey) => {
      const date = new Date(dateKey);
      cells.push({
        date: dateKey,
        dayOfWeek: date.getDay(),
        week: getWeekNumber(date),
        amount: data.amount,
        count: data.count,
      });
    });

    // Sort by date
    cells.sort((a, b) => a.date.localeCompare(b.date));

    return cells;
  }, [expenses, dateRange]);
}
