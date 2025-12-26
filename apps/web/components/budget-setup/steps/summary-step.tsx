"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Wallet,
  PiggyBank,
  Calendar,
  Edit2,
  Check,
} from "lucide-react";
import type { BudgetSummary } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface SummaryStepProps {
  summary: BudgetSummary;
  dailyLimitOverride: number | null;
  onDailyLimitOverrideChange: (value: number | null) => void;
}

export function SummaryStep({
  summary,
  dailyLimitOverride,
  onDailyLimitOverrideChange,
}: SummaryStepProps) {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editValue, setEditValue] = useState(
    dailyLimitOverride?.toString() || summary.calculatedDailyLimit.toString()
  );

  const finalDailyLimit = dailyLimitOverride ?? summary.calculatedDailyLimit;

  const handleSaveLimit = () => {
    const value = parseInt(editValue);
    if (!isNaN(value) && value > 0) {
      if (value === summary.calculatedDailyLimit) {
        onDailyLimitOverrideChange(null); // Use calculated
      } else {
        onDailyLimitOverrideChange(value);
      }
    }
    setIsEditingLimit(false);
  };

  return (
    <div className="space-y-6">
      {/* Budget breakdown */}
      <div className="space-y-3">
        {/* Income */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Total Monthly Income</span>
            <span className="text-lg font-semibold text-green-600">
              +{CURRENCY}
              {Math.round(summary.totalMonthlyIncome).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-stone-400" />
        </div>

        {/* Fixed expenses */}
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-stone-600">Fixed Expenses</span>
            <span className="text-lg font-semibold text-red-500">
              -{CURRENCY}
              {Math.round(summary.totalFixedExpenses).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="h-5 w-5 text-stone-400" />
        </div>

        {/* Available for budgeting */}
        <div className="rounded-lg border-2 border-stone-300 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-stone-700">
              Available for Budgeting
            </span>
            <span className="text-xl font-bold text-stone-800">
              {CURRENCY}
              {Math.round(summary.availableForBudgeting).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bucket allocations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <PiggyBank className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">Savings (20%)</p>
              <p className="text-lg font-bold text-green-800">
                {CURRENCY}
                {Math.round(summary.savingsAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Daily Spending (80%)</p>
              <p className="text-lg font-bold text-blue-800">
                {CURRENCY}
                {Math.round(summary.dailySpendingAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily limit calculation */}
      <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-200">
              <Calendar className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">
                Your Daily Budget
              </p>
              <p className="text-xs text-amber-600">
                {CURRENCY}
                {Math.round(summary.dailySpendingAmount).toLocaleString()} ÷{" "}
                {summary.daysInMonth} days
              </p>
            </div>
          </div>

          {isEditingLimit ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700">
                  {CURRENCY}
                </span>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                  className="w-28 rounded-lg border border-amber-400 bg-white py-2 pl-8 pr-3 text-xl font-bold text-amber-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
              <button
                onClick={handleSaveLimit}
                className="rounded-lg bg-amber-600 p-2 text-white hover:bg-amber-700"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-amber-800">
                {CURRENCY}
                {finalDailyLimit.toLocaleString()}
              </span>
              <button
                onClick={() => {
                  setEditValue(finalDailyLimit.toString());
                  setIsEditingLimit(true);
                }}
                className="rounded-lg p-2 text-amber-600 hover:bg-amber-100"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {dailyLimitOverride !== null && (
          <p className="mt-3 text-sm text-amber-600">
            Custom limit set. Calculated would be {CURRENCY}
            {summary.calculatedDailyLimit.toLocaleString()}/day.
            <button
              onClick={() => onDailyLimitOverrideChange(null)}
              className="ml-2 underline hover:text-amber-700"
            >
              Reset to calculated
            </button>
          </p>
        )}
      </div>

      {/* Explanation */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h4 className="mb-2 font-medium text-stone-800">How it works</h4>
        <ul className="space-y-2 text-sm text-stone-600">
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
            <span>
              Your daily budget of <strong>{CURRENCY}{finalDailyLimit}</strong> will be your
              spending limit each day.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
            <span>
              The calendar will show green when you&apos;re under budget, amber when
              close, and red when over.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-stone-400" />
            <span>
              You can adjust your buckets and daily limit anytime from settings.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
