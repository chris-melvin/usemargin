"use client";

import { TrendingUp, TrendingDown, CreditCard, Wallet, PieChart } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface BudgetSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  remaining: number;
  currency: string;
}

export function BudgetSummary({
  totalIncome,
  totalExpenses,
  totalDebt,
  remaining,
  currency,
}: BudgetSummaryProps) {
  const isPositive = remaining >= 0;
  const spentPercent = totalIncome > 0
    ? Math.min(((totalExpenses + totalDebt) / totalIncome) * 100, 100)
    : 0;
  const remainingPercent = 100 - spentPercent;

  return (
    <div className="group relative h-full bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-amber-200 hover:shadow-lg transition-all duration-300">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 bg-paper-texture opacity-5 pointer-events-none" />

      <div className="relative h-full flex flex-col p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
            <PieChart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">Budget Overview</h3>
            <p className="text-xs text-stone-500">Monthly snapshot</p>
          </div>
        </div>

        {/* Center: Circular Progress */}
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="relative w-32 h-32 lg:w-40 lg:h-40">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f5f4" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isPositive ? "#10b981" : "#ef4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={264}
                strokeDashoffset={264 * (1 - remainingPercent / 100)}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={cn(
                "text-2xl lg:text-3xl font-bold tabular-nums",
                isPositive ? "text-emerald-600" : "text-rose-600"
              )}>
                {Math.round(remainingPercent)}%
              </p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                {isPositive ? "Available" : "Over"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {/* Income */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-emerald-600/70">Income</p>
              <p className="text-sm font-bold text-emerald-600 tabular-nums truncate">
                {formatCurrency(totalIncome, currency)}
              </p>
            </div>
          </div>

          {/* Expenses */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/80">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-amber-600/70">Expenses</p>
              <p className="text-sm font-bold text-amber-600 tabular-nums truncate">
                {formatCurrency(totalExpenses, currency)}
              </p>
            </div>
          </div>

          {/* Debt */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50/80">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-rose-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-rose-600/70">Debt</p>
              <p className="text-sm font-bold text-rose-600 tabular-nums truncate">
                {formatCurrency(totalDebt, currency)}
              </p>
            </div>
          </div>

          {/* Remaining */}
          <div className={cn(
            "flex items-center gap-2 p-2.5 rounded-xl",
            isPositive ? "bg-blue-50/80" : "bg-rose-50/80"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              isPositive ? "bg-blue-100" : "bg-rose-100"
            )}>
              <Wallet className={cn("w-4 h-4", isPositive ? "text-blue-600" : "text-rose-600")} />
            </div>
            <div className="min-w-0">
              <p className={cn(
                "text-[9px] uppercase tracking-wider",
                isPositive ? "text-blue-600/70" : "text-rose-600/70"
              )}>
                {isPositive ? "Remaining" : "Over"}
              </p>
              <p className={cn(
                "text-sm font-bold tabular-nums truncate",
                isPositive ? "text-blue-600" : "text-rose-600"
              )}>
                {formatCurrency(Math.abs(remaining), currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
