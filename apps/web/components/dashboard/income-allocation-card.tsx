"use client";

import { useMemo, useState } from "react";
import { PieChart, Eye, EyeOff, TrendingUp } from "lucide-react";
import { AllocationPieChart } from "@/components/charts/allocation-pie-chart";
import { formatCurrency, cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface IncomeAllocationCardProps {
  totalIncome: number;
  dailyBudgetAllocation: number;  // Amount allocated for daily spending
  billsAllocation: number;         // Amount for fixed bills
  flexBucketAllocation: number;    // Amount for flex bucket
  savingsAllocation: number;       // Amount for savings
  hideSavings?: boolean;           // Whether to exclude savings from chart
  onToggleSavings?: (hidden: boolean) => void;
}

// Color palette matching the app's stone/amber theme
const COLORS = {
  dailyBudget: "#f59e0b", // amber-500
  bills: "#ef4444",       // red-500
  flexBucket: "#8b5cf6",  // violet-500
  savings: "#10b981",     // emerald-500
};

export function IncomeAllocationCard({
  totalIncome,
  dailyBudgetAllocation,
  billsAllocation,
  flexBucketAllocation,
  savingsAllocation,
  hideSavings = false,
  onToggleSavings,
}: IncomeAllocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate chart data
  const chartData = useMemo(() => {
    const total = hideSavings
      ? dailyBudgetAllocation + billsAllocation + flexBucketAllocation
      : totalIncome;

    const data = [
      {
        name: "Daily Budget",
        value: dailyBudgetAllocation,
        color: COLORS.dailyBudget,
        percentage: (dailyBudgetAllocation / total) * 100,
      },
      {
        name: "Bills",
        value: billsAllocation,
        color: COLORS.bills,
        percentage: (billsAllocation / total) * 100,
      },
      {
        name: "Flex Bucket",
        value: flexBucketAllocation,
        color: COLORS.flexBucket,
        percentage: (flexBucketAllocation / total) * 100,
      },
    ];

    if (!hideSavings && savingsAllocation > 0) {
      data.push({
        name: "Savings",
        value: savingsAllocation,
        color: COLORS.savings,
        percentage: (savingsAllocation / total) * 100,
      });
    }

    return data;
  }, [dailyBudgetAllocation, billsAllocation, flexBucketAllocation, savingsAllocation, hideSavings, totalIncome]);

  // Calculate allocation percentages for display
  const allocations = useMemo(() => {
    const items = [
      { label: "Daily Budget", amount: dailyBudgetAllocation, color: COLORS.dailyBudget },
      { label: "Bills", amount: billsAllocation, color: COLORS.bills },
      { label: "Flex Bucket", amount: flexBucketAllocation, color: COLORS.flexBucket },
    ];

    if (!hideSavings) {
      items.push({ label: "Savings", amount: savingsAllocation, color: COLORS.savings });
    }

    return items;
  }, [dailyBudgetAllocation, billsAllocation, flexBucketAllocation, savingsAllocation, hideSavings]);

  return (
    <div className="bg-white border border-stone-200 rounded-[1.5rem] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <PieChart className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-800">Income Allocation</h3>
            <p className="text-[10px] text-stone-400">
              Total: {formatCurrency(totalIncome, CURRENCY)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Savings Visibility */}
          {savingsAllocation > 0 && onToggleSavings && (
            <button
              onClick={() => onToggleSavings(!hideSavings)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                hideSavings
                  ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              )}
              title={hideSavings ? "Show savings in chart" : "Hide savings from chart"}
            >
              {hideSavings ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  <span>Savings Hidden</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  <span>Savings Visible</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <AllocationPieChart data={chartData} />
      </div>

      {/* Allocation Breakdown */}
      <div className="px-5 pb-5 space-y-2">
        {allocations.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-stone-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-stone-800 tabular-nums">
              {formatCurrency(item.amount, CURRENCY)}
            </span>
          </div>
        ))}
      </div>

      {/* Savings Set Aside Notice */}
      {hideSavings && savingsAllocation > 0 && (
        <div className="mx-5 mb-5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                {formatCurrency(savingsAllocation, CURRENCY)} set aside for savings
              </p>
              <p className="text-[10px] text-emerald-600">
                Excluded from budget allocation view
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
