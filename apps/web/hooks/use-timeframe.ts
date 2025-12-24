"use client";

import { useState, useMemo, useCallback } from "react";
import type { TimeframeOption, DateRange } from "@/lib/types";

interface UseTimeframeReturn {
  timeframe: TimeframeOption;
  setTimeframe: (timeframe: TimeframeOption) => void;
  dateRange: DateRange;
  setCustomRange: (range: DateRange) => void;
  label: string;
}

// Get date range for a timeframe
function getDateRangeForTimeframe(timeframe: TimeframeOption): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (timeframe) {
    case "daily": {
      return {
        start: today.toISOString().split("T")[0]!,
        end: today.toISOString().split("T")[0]!,
      };
    }
    case "weekly": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: startOfWeek.toISOString().split("T")[0]!,
        end: today.toISOString().split("T")[0]!,
      };
    }
    case "monthly": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: startOfMonth.toISOString().split("T")[0]!,
        end: today.toISOString().split("T")[0]!,
      };
    }
    case "yearly": {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        start: startOfYear.toISOString().split("T")[0]!,
        end: today.toISOString().split("T")[0]!,
      };
    }
    case "all":
    default: {
      // Last 2 years by default for "all"
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(today.getFullYear() - 2);
      return {
        start: twoYearsAgo.toISOString().split("T")[0]!,
        end: today.toISOString().split("T")[0]!,
      };
    }
  }
}

// Get label for timeframe
function getTimeframeLabel(timeframe: TimeframeOption, dateRange: DateRange): string {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);

  switch (timeframe) {
    case "daily":
      return end.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    case "weekly":
      return `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    case "monthly":
      return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    case "yearly":
      return start.getFullYear().toString();
    case "all":
      return "All Time";
    default:
      return "";
  }
}

export function useTimeframe(
  initialTimeframe: TimeframeOption = "monthly"
): UseTimeframeReturn {
  const [timeframe, setTimeframeState] = useState<TimeframeOption>(initialTimeframe);
  const [customRange, setCustomRangeState] = useState<DateRange | null>(null);

  // Calculate date range based on timeframe or custom range
  const dateRange = useMemo(() => {
    if (customRange) return customRange;
    return getDateRangeForTimeframe(timeframe);
  }, [timeframe, customRange]);

  // Label for display
  const label = useMemo(() => {
    return getTimeframeLabel(timeframe, dateRange);
  }, [timeframe, dateRange]);

  // Set timeframe and clear custom range
  const setTimeframe = useCallback((newTimeframe: TimeframeOption) => {
    setTimeframeState(newTimeframe);
    setCustomRangeState(null);
  }, []);

  // Set custom date range
  const setCustomRange = useCallback((range: DateRange) => {
    setCustomRangeState(range);
  }, []);

  return {
    timeframe,
    setTimeframe,
    dateRange,
    setCustomRange,
    label,
  };
}

// Utility to filter data by date range
export function filterByDateRange<T extends { date: string }>(
  data: T[],
  dateRange: DateRange
): T[] {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  end.setHours(23, 59, 59, 999);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}
