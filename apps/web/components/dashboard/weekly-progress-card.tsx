"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface WeeklyProgressCardProps {
  spent: number;
  budget: number;
  percentUsed: number;
  daysTracked: number;
  currency: string;
}

export function WeeklyProgressCard({
  spent,
  budget,
  percentUsed,
  daysTracked,
  currency,
}: WeeklyProgressCardProps) {
  const remaining = budget - spent;
  const isOver = remaining < 0;
  const isOnTrack = percentUsed <= (daysTracked / 7) * 100 + 5; // 5% grace margin

  // Determine status
  const getStatus = () => {
    if (isOver) {
      return {
        label: "Over budget",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        icon: TrendingUp,
        iconColor: "text-rose-500",
      };
    }
    if (isOnTrack) {
      return {
        label: "On track",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        icon: TrendingDown,
        iconColor: "text-emerald-500",
      };
    }
    return {
      label: "Slightly ahead",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      icon: Minus,
      iconColor: "text-amber-500",
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Calculate progress bar width (cap at 100% for visual)
  const progressWidth = Math.min(percentUsed, 100);

  return (
    <div className="p-4 border-b border-neutral-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
            This Week
          </p>
          <p className="text-sm font-semibold text-neutral-800">
            Weekly Progress
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            status.bgColor,
            status.color
          )}
        >
          <StatusIcon className={cn("w-3 h-3", status.iconColor)} />
          {status.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
            isOver ? "bg-rose-500" : isOnTrack ? "bg-teal-500" : "bg-amber-500"
          )}
          style={{ width: `${progressWidth}%` }}
        />
        {/* Expected position marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-neutral-400/50"
          style={{ left: `${(daysTracked / 7) * 100}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-semibold text-neutral-800 tabular-nums">
            {formatCurrency(spent, currency)}
          </span>
          <span className="text-neutral-400 mx-1">/</span>
          <span className="text-neutral-500 tabular-nums">
            {formatCurrency(budget, currency)}
          </span>
        </div>
        <div
          className={cn(
            "font-medium tabular-nums",
            isOver ? "text-rose-600" : "text-neutral-600"
          )}
        >
          {isOver ? "-" : ""}
          {formatCurrency(Math.abs(remaining), currency)}{" "}
          <span className="text-neutral-400 font-normal">left</span>
        </div>
      </div>

      {/* Days info */}
      <p className="text-xs text-neutral-400 mt-2">
        Day {daysTracked} of 7 · {Math.round(percentUsed)}% used
      </p>
    </div>
  );
}
