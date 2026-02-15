"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { MonthComparison } from "@/lib/insights/types";

interface MonthComparisonCardProps {
  comparison: MonthComparison | null;
}

export function MonthComparisonCard({ comparison }: MonthComparisonCardProps) {
  if (!comparison) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="p-4 text-center">
          <p className="text-xs text-neutral-400">
            Track for 2 months to compare
          </p>
        </div>
      </div>
    );
  }

  const isLess = comparison.percentChange < 0;
  const isMore = comparison.percentChange > 0;
  const absPercent = Math.abs(comparison.percentChange);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          vs {comparison.previousMonthLabel}
        </h3>
      </div>
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span
            className={`text-lg ${isLess ? "text-emerald-600" : isMore ? "text-rose-500" : "text-neutral-500"}`}
          >
            {isLess ? "\u2193" : isMore ? "\u2191" : "\u2192"}
          </span>
          <span
            className={`text-2xl font-bold tabular-nums ${isLess ? "text-emerald-600" : isMore ? "text-rose-500" : "text-neutral-900"}`}
          >
            {absPercent}%
          </span>
          <span
            className={`text-sm ${isLess ? "text-emerald-600" : isMore ? "text-rose-500" : "text-neutral-500"}`}
          >
            {isLess ? "less" : isMore ? "more" : "same"}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 tabular-nums">
          {formatCurrency(comparison.currentTotal, CURRENCY)} vs{" "}
          {formatCurrency(comparison.previousTotal, CURRENCY)} (first{" "}
          {comparison.currentDays} days)
        </p>
      </div>
    </div>
  );
}
