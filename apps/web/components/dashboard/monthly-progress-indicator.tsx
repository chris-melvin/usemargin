"use client";

import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface MonthlyProgressIndicatorProps {
  aheadBehindAmount: number;
  projectedEndOfMonth: number;
  totalBudget: number;
  daysElapsed: number;
  totalDays: number;
  currency: string;
}

export function MonthlyProgressIndicator({
  aheadBehindAmount,
  projectedEndOfMonth,
  totalBudget,
  daysElapsed,
  totalDays,
  currency,
}: MonthlyProgressIndicatorProps) {
  const isAhead = aheadBehindAmount > 0;
  const projectedOver = projectedEndOfMonth > totalBudget;

  return (
    <div className="p-4 border-b border-neutral-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-neutral-600" />
        </div>
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
            This Month
          </p>
          <p className="text-sm font-semibold text-neutral-800">
            Monthly Progress
          </p>
        </div>
      </div>

      {/* Ahead/Behind Status */}
      <div
        className={cn(
          "flex items-center justify-between p-3 rounded-lg mb-2",
          isAhead ? "bg-emerald-50" : "bg-rose-50"
        )}
      >
        <div className="flex items-center gap-2">
          {isAhead ? (
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-rose-600" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isAhead ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {isAhead ? "Ahead of budget" : "Behind budget"}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            isAhead ? "text-emerald-700" : "text-rose-700"
          )}
        >
          {isAhead ? "+" : "-"}
          {formatCurrency(Math.abs(aheadBehindAmount), currency)}
        </span>
      </div>

      {/* Projection */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500">Projected end of month</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            projectedOver ? "text-rose-600" : "text-neutral-700"
          )}
        >
          {formatCurrency(projectedEndOfMonth, currency)}
        </span>
      </div>

      {/* Budget comparison */}
      <div className="flex items-center justify-between text-sm mt-1">
        <span className="text-neutral-500">Monthly budget</span>
        <span className="text-neutral-700 font-medium tabular-nums">
          {formatCurrency(totalBudget, currency)}
        </span>
      </div>

      {/* Days progress */}
      <p className="text-xs text-neutral-400 mt-3">
        Day {daysElapsed} of {totalDays}
      </p>
    </div>
  );
}
