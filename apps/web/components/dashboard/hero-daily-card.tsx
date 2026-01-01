"use client";

import { useMemo } from "react";
import { Sparkles, TrendingDown, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface ExpenseItem {
  label: string;
  amount: number;
}

interface HeroDailyCardProps {
  remaining: number;
  limit?: number;
  spent: number;
  expenses?: ExpenseItem[];
}

type BudgetStatus = "safe" | "close" | "low" | "over";

function getBudgetStatus(remaining: number, limit: number): BudgetStatus {
  const percentRemaining = (remaining / limit) * 100;
  if (remaining < 0) return "over";
  if (percentRemaining < 20) return "low";
  if (percentRemaining < 50) return "close";
  return "safe";
}

const STATUS_CONFIG = {
  safe: {
    message: "You're on track. Keep it up!",
    icon: Sparkles,
    gradientFrom: "from-emerald-50/40",
    gradientVia: "via-neutral-50/20",
    gradientTo: "to-transparent",
    ringColor: "stroke-emerald-500",
    ringBg: "stroke-emerald-100",
    textColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  close: {
    message: "Getting close. Spend mindfully.",
    icon: Zap,
    gradientFrom: "from-amber-50/50",
    gradientVia: "via-orange-50/20",
    gradientTo: "to-transparent",
    ringColor: "stroke-amber-500",
    ringBg: "stroke-amber-100",
    textColor: "text-amber-600",
    accentBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  low: {
    message: "Almost at limit. Consider pausing.",
    icon: TrendingDown,
    gradientFrom: "from-orange-50/60",
    gradientVia: "via-rose-50/30",
    gradientTo: "to-transparent",
    ringColor: "stroke-orange-500",
    ringBg: "stroke-orange-100",
    textColor: "text-orange-600",
    accentBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  over: {
    message: "Over budget. Consider FlexBucket?",
    icon: AlertCircle,
    gradientFrom: "from-rose-50/60",
    gradientVia: "via-red-50/30",
    gradientTo: "to-transparent",
    ringColor: "stroke-rose-500",
    ringBg: "stroke-rose-200",
    textColor: "text-rose-600",
    accentBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
};

function CircularProgress({
  percent,
  status,
  size = 140,
  strokeWidth = 8,
}: {
  percent: number;
  status: BudgetStatus;
  size?: number;
  strokeWidth?: number;
}) {
  const config = STATUS_CONFIG[status];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background ring */}
        <circle
          className={cn("transition-all duration-700", config.ringBg)}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress ring */}
        <circle
          className={cn(
            "transition-all duration-1000 ease-out",
            config.ringColor
          )}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold", config.textColor)}>
          <AnimatedNumber value={Math.round(clampedPercent)} duration={800} />%
        </span>
        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
          left
        </span>
      </div>
    </div>
  );
}

export function HeroDailyCard({
  remaining,
  limit = 300,
  spent,
  expenses = [],
}: HeroDailyCardProps) {
  const status = useMemo(() => getBudgetStatus(remaining, limit), [remaining, limit]);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const percentRemaining = Math.max(0, (remaining / limit) * 100);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "relative w-full max-w-md mx-auto overflow-hidden",
        "rounded-3xl border border-stone-200/60",
        "bg-gradient-to-br",
        config.gradientFrom,
        config.gradientVia,
        config.gradientTo,
        "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]",
        "backdrop-blur-sm"
      )}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium mb-1">
              Today
            </p>
            <h2 className="text-sm sm:text-base text-neutral-600 font-medium">
              {today}
            </h2>
          </div>
          <div
            className={cn(
              "animate-in fade-in zoom-in duration-500 delay-100",
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              config.accentBg
            )}
          >
            <StatusIcon className={cn("w-3.5 h-3.5", config.iconColor)} />
            <span className={cn("text-xs font-medium", config.textColor)}>
              {status === "safe" ? "On Track" : status === "close" ? "Watch It" : status === "low" ? "Low" : "Over"}
            </span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex items-center gap-6 sm:gap-8 mb-6">
          {/* Progress ring */}
          <div className="animate-in fade-in zoom-in duration-700 delay-200 flex-shrink-0">
            <CircularProgress percent={percentRemaining} status={status} />
          </div>

          {/* Amount display */}
          <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300 flex-1 min-w-0">
            <div className="mb-1">
              <span className={cn(
                "text-4xl sm:text-5xl font-bold tracking-tight",
                status === "over" ? "text-rose-600" : "text-neutral-900"
              )}>
                {status === "over" && "-"}
                {CURRENCY}
                <AnimatedNumber value={Math.abs(remaining)} duration={600} />
              </span>
            </div>
            <p className="text-sm text-neutral-400">
              {status === "over" ? (
                <>over your {CURRENCY}{limit.toLocaleString()} budget</>
              ) : (
                <>remaining of {CURRENCY}{limit.toLocaleString()}</>
              )}
            </p>
          </div>
        </div>

        {/* Insight message */}
        <div
          className={cn(
            "animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400",
            "flex items-center gap-2 px-4 py-3 rounded-2xl mb-4",
            "bg-white/60 border border-stone-100"
          )}
        >
          <div className={cn("w-1 h-8 rounded-full",
            status === "safe" ? "bg-emerald-400" :
            status === "close" ? "bg-amber-400" :
            status === "low" ? "bg-orange-400" : "bg-rose-400"
          )} />
          <p className="text-sm text-neutral-600 font-medium">
            {config.message}
          </p>
        </div>

        {/* Today's expenses */}
        {expenses.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500">
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.15em] mb-2">
              Today's Expenses
            </p>
            <div className="flex flex-wrap gap-2">
              {expenses.map((expense, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "bg-white/80 border border-stone-100",
                    "text-xs text-neutral-600 font-medium",
                    "animate-in fade-in zoom-in duration-300"
                  )}
                  style={{ animationDelay: `${600 + i * 50}ms` }}
                >
                  {expense.label}
                  <span className="text-neutral-400 tabular-nums">
                    {CURRENCY}{expense.amount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for no expenses */}
        {expenses.length === 0 && spent === 0 && (
          <div className="animate-in fade-in duration-500 delay-500 text-center py-2">
            <p className="text-xs text-neutral-400">
              No expenses yet today. Start fresh!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
