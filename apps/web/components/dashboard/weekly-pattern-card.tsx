"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Calendar,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface CategoryData {
  category: string;
  amount: number;
  previousAmount: number;
  icon?: string;
}

interface WeeklyPatternCardProps {
  weeklyTotal: number;
  previousWeekTotal: number;
  categoryBreakdown: CategoryData[];
  highestDay: { day: string; amount: number };
  suggestion?: string;
}

function getPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const change = getPercentChange(current, previous);

  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-neutral-400 text-xs">
        <Minus className="w-3 h-3" />
        <span className="tabular-nums">0%</span>
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-rose-500 text-xs">
        <TrendingUp className="w-3 h-3" />
        <span className="tabular-nums">+{change}%</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-emerald-500 text-xs">
      <TrendingDown className="w-3 h-3" />
      <span className="tabular-nums">{change}%</span>
    </span>
  );
}

function AnimatedBar({
  percent,
  delay = 0,
  colorClass = "bg-neutral-800"
}: {
  percent: number;
  delay?: number;
  colorClass?: string;
}) {
  return (
    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-1000 ease-out",
          colorClass
        )}
        style={{
          width: `${percent}%`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

export function WeeklyPatternCard({
  weeklyTotal,
  previousWeekTotal,
  categoryBreakdown,
  highestDay,
  suggestion,
}: WeeklyPatternCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate max for relative bar widths
  const maxAmount = useMemo(() => {
    return Math.max(...categoryBreakdown.map((c) => c.amount), 1);
  }, [categoryBreakdown]);

  // Get top category
  const topCategory = useMemo(() => {
    if (categoryBreakdown.length === 0) return null;
    return [...categoryBreakdown].sort((a, b) => b.amount - a.amount)[0];
  }, [categoryBreakdown]);

  const weeklyChange = getPercentChange(weeklyTotal, previousWeekTotal);

  // Get color based on spending ratio
  const getBarColor = (amount: number, previous: number) => {
    const change = getPercentChange(amount, previous);
    if (change > 20) return "bg-rose-400";
    if (change < -10) return "bg-emerald-400";
    return "bg-amber-400";
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center border border-amber-200/50">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-neutral-800 tracking-tight">
              This Week's Story
            </h3>
            <p className="text-xs text-neutral-400">
              {CURRENCY}{weeklyTotal.toLocaleString()} spent
              <span className={cn(
                "ml-2",
                weeklyChange > 0 ? "text-rose-500" : weeklyChange < 0 ? "text-emerald-500" : "text-neutral-400"
              )}>
                {weeklyChange > 0 ? "+" : ""}{weeklyChange}% vs last week
              </span>
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-neutral-400 transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pb-5 space-y-5">
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />

          {/* Key metrics row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Top Category */}
            {topCategory && (
              <div className="p-4 rounded-xl bg-neutral-50/50 border border-stone-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Top Category
                  </span>
                </div>
                <p className="text-sm font-semibold text-neutral-800 mb-1">
                  {topCategory.icon && <span className="mr-1">{topCategory.icon}</span>}
                  {topCategory.category}
                </p>
                <p className="text-lg font-bold text-neutral-900 tabular-nums">
                  {CURRENCY}{topCategory.amount.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <AnimatedBar
                    percent={(topCategory.amount / weeklyTotal) * 100}
                    colorClass="bg-amber-400"
                  />
                  <span className="text-[10px] text-neutral-400 tabular-nums">
                    {Math.round((topCategory.amount / weeklyTotal) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Highest Day */}
            <div className="p-4 rounded-xl bg-neutral-50/50 border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Highest Day
                </span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 mb-1">
                {highestDay.day}
              </p>
              <p className="text-lg font-bold text-neutral-900 tabular-nums">
                {CURRENCY}{highestDay.amount.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <AnimatedBar
                  percent={(highestDay.amount / weeklyTotal) * 100}
                  delay={100}
                  colorClass="bg-neutral-600"
                />
                <span className="text-[10px] text-neutral-400 tabular-nums">
                  {Math.round((highestDay.amount / weeklyTotal) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Category Breakdown
              </h4>
              <div className="space-y-3">
                {categoryBreakdown
                  .sort((a, b) => b.amount - a.amount)
                  .map((category, index) => (
                    <div
                      key={category.category}
                      className="animate-in fade-in slide-in-from-left-2 duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-sm">{category.icon}</span>
                          )}
                          <span className="text-sm text-neutral-700">
                            {category.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-neutral-800 tabular-nums">
                            {CURRENCY}{category.amount.toLocaleString()}
                          </span>
                          <TrendIndicator
                            current={category.amount}
                            previous={category.previousAmount}
                          />
                        </div>
                      </div>
                      <AnimatedBar
                        percent={(category.amount / maxAmount) * 100}
                        delay={index * 100}
                        colorClass={getBarColor(category.amount, category.previousAmount)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div className="flex gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                  Suggestion
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {suggestion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
