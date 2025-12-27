"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ParentSize } from "@visx/responsive";
import {
  ArrowLeft,
  Calendar,
  PieChart,
  TrendingUp,
  ChevronDown,
  Sparkles,
} from "lucide-react";

import { VisxSankey } from "@/components/charts/visx-sankey";
import { VisxHeatmap } from "@/components/charts/visx-heatmap";
import { VisxTreemap } from "@/components/charts/visx-treemap";
import { VisxLineChart } from "@/components/charts/visx-line-chart";

import { useTimeframe } from "@/hooks/use-timeframe";
import { useCashFlow } from "@/hooks/use-cash-flow";
import { useSpendingHeatmap } from "@/hooks/use-spending-heatmap";
import { useCategoryTree } from "@/hooks/use-category-tree";
import { useNetWorth } from "@/hooks/use-net-worth";
import { useExpenses } from "@/hooks/use-expenses";

import { formatCurrency, cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { TimeframeOption, LocalIncome, LocalBill } from "@/lib/types";

// Demo data matching main page
const DEMO_INCOMES: LocalIncome[] = [
  {
    id: "i1",
    label: "Salary",
    amount: 25000,
    dayOfMonth: 15,
    isRecurring: true,
    recurringPattern: { frequency: "monthly" },
    status: "expected",
  },
  {
    id: "i2",
    label: "Freelance",
    amount: 5000,
    dayOfMonth: 28,
    isRecurring: true,
    recurringPattern: { frequency: "monthly" },
    status: "expected",
  },
];

const DEMO_BILLS: LocalBill[] = [
  {
    id: "b1",
    label: "Credit Card",
    amount: 5000,
    dueDate: "2024-12-05",
    dueDayOfMonth: 5,
    icon: "💳",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 5 },
    status: "pending",
  },
  {
    id: "b2",
    label: "Rent",
    amount: 8000,
    dueDate: "2024-12-01",
    dueDayOfMonth: 1,
    icon: "🏠",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 1 },
    status: "pending",
  },
  {
    id: "b3",
    label: "Internet",
    amount: 1500,
    dueDate: "2024-12-10",
    dueDayOfMonth: 10,
    icon: "📶",
    isRecurring: true,
    recurringPattern: { frequency: "monthly", dayOfMonth: 10 },
    status: "pending",
  },
];

const TIMEFRAME_OPTIONS: { value: TimeframeOption; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "yearly", label: "This Year" },
  { value: "all", label: "All Time" },
];

// Chart card wrapper component
function ChartCard({
  title,
  icon: Icon,
  children,
  className,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "relative bg-white/80 backdrop-blur-sm border border-stone-200/60 rounded-2xl overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]",
        "animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100/80">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 shadow-inner">
          <Icon className="w-4.5 h-4.5 text-amber-600" strokeWidth={1.75} />
        </div>
        <h3 className="text-sm font-semibold tracking-tight text-stone-800">
          {title}
        </h3>
      </div>

      {/* Card Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function AnalyticsContent() {
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  // Hooks
  const { expenses } = useExpenses();
  const { timeframe, setTimeframe, dateRange, label } = useTimeframe("monthly");
  const { netWorth, getFilteredSnapshots } = useNetWorth();

  // Transform data for charts
  const cashFlowData = useCashFlow({
    expenses,
    incomes: DEMO_INCOMES,
    bills: DEMO_BILLS,
    dateRange,
    savingsAllocation: 5000,
    flexBucketAllocation: 5000,
  });

  const heatmapData = useSpendingHeatmap({
    expenses,
    dateRange,
  });

  const categoryTreeData = useCategoryTree({
    expenses,
    dateRange,
  });

  const filteredSnapshots = useMemo(
    () => getFilteredSnapshots(dateRange),
    [getFilteredSnapshots, dateRange]
  );

  // Calculate summary stats
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  return (
    <div className="min-h-screen bg-[#fafaf9] relative">
      {/* Subtle grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Link
              href="/"
              className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-stone-200/60 shadow-sm hover:shadow-md hover:border-stone-300/60 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-stone-500 group-hover:text-stone-700 transition-colors" />
            </Link>

            {/* Title */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                  usemargin
                </h1>
                <span className="text-stone-300">·</span>
                <span className="text-xl font-medium text-stone-500">
                  Analytics
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 tracking-wide">
                {label}
              </p>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="relative">
            <button
              onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200/60",
                "shadow-sm hover:shadow-md hover:border-stone-300/60 transition-all duration-200",
                "text-sm font-medium text-stone-700"
              )}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>
                {TIMEFRAME_OPTIONS.find((t) => t.value === timeframe)?.label}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-stone-400 transition-transform duration-200",
                  isTimeframeOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {isTimeframeOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsTimeframeOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-44 py-1.5 bg-white border border-stone-200/60 rounded-xl shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTimeframe(option.value);
                        setIsTimeframeOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-2 text-left text-sm transition-colors",
                        timeframe === option.value
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Summary Stats Bar */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "100ms" }}
        >
          {[
            {
              label: "Total Spent",
              value: formatCurrency(totalSpent, CURRENCY),
              accent: "text-stone-800",
            },
            {
              label: "Net Worth",
              value: formatCurrency(netWorth, CURRENCY),
              accent: netWorth >= 0 ? "text-emerald-600" : "text-red-600",
            },
            {
              label: "Income",
              value: formatCurrency(
                DEMO_INCOMES.reduce((s, i) => s + i.amount, 0),
                CURRENCY
              ),
              accent: "text-emerald-600",
            },
            {
              label: "Bills",
              value: formatCurrency(
                DEMO_BILLS.reduce((s, b) => s + b.amount, 0),
                CURRENCY
              ),
              accent: "text-rose-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-stone-200/40"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-stone-400 mb-1">
                {stat.label}
              </p>
              <p className={cn("text-lg font-semibold tabular-nums", stat.accent)}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="space-y-4">
          {/* Cash Flow - Full Width */}
          <ChartCard title="Cash Flow" icon={Sparkles} delay={200}>
            <div className="h-[280px] md:h-[320px]">
              <ParentSize>
                {({ width, height }) =>
                  width > 0 && height > 0 ? (
                    <VisxSankey
                      data={cashFlowData}
                      width={width}
                      height={height}
                    />
                  ) : null
                }
              </ParentSize>
            </div>
          </ChartCard>

          {/* Middle Row - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spending Heatmap */}
            <ChartCard title="Spending Patterns" icon={Calendar} delay={300}>
              <div className="h-[220px] md:h-[260px]">
                <ParentSize>
                  {({ width, height }) =>
                    width > 0 && height > 0 ? (
                      <VisxHeatmap
                        data={heatmapData}
                        width={width}
                        height={height}
                      />
                    ) : null
                  }
                </ParentSize>
              </div>
            </ChartCard>

            {/* Category Breakdown */}
            <ChartCard title="Category Breakdown" icon={PieChart} delay={400}>
              <div className="h-[220px] md:h-[260px]">
                <ParentSize>
                  {({ width, height }) =>
                    width > 0 && height > 0 ? (
                      <VisxTreemap
                        data={categoryTreeData}
                        width={width}
                        height={height}
                      />
                    ) : null
                  }
                </ParentSize>
              </div>
            </ChartCard>
          </div>

          {/* Net Worth - Full Width */}
          <ChartCard title="Net Worth Trend" icon={TrendingUp} delay={500}>
            <div className="h-[280px] md:h-[320px]">
              <ParentSize>
                {({ width, height }) =>
                  width > 0 && height > 0 ? (
                    <VisxLineChart
                      data={filteredSnapshots}
                      width={width}
                      height={height}
                      showAssets={true}
                      showLiabilities={true}
                      showNetWorth={true}
                    />
                  ) : null
                }
              </ParentSize>
            </div>
          </ChartCard>
        </div>

        {/* Footer */}
        <footer
          className="mt-8 pt-6 border-t border-stone-200/60 animate-in fade-in duration-700"
          style={{ animationDelay: "600ms" }}
        >
          <p className="text-center text-xs text-stone-400">
            Analytics powered by{" "}
            <span className="font-medium text-stone-500">visx</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
