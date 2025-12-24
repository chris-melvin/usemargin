"use client";

import { cn, formatCurrency, isToday } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import { Banknote, CreditCard } from "lucide-react";

interface CalendarDayProps {
  day: CalendarDay;
  onClick: () => void;
  compact?: boolean;
}

// Get status color based on spending percentage
function getStatusStyle(spent: number, limit: number, isPast: boolean): {
  bg: string;
  fill: string;
  text: string;
  status: "under" | "near" | "over" | "none";
} {
  if (!isPast || spent === 0) {
    return {
      bg: "bg-stone-50/30",
      fill: "bg-stone-200",
      text: "text-stone-500",
      status: "none",
    };
  }

  const percent = (spent / limit) * 100;

  if (percent > 100) {
    return {
      bg: "bg-rose-100/80",
      fill: "bg-rose-500",
      text: "text-rose-700",
      status: "over",
    };
  } else if (percent >= 80) {
    return {
      bg: "bg-amber-100/60",
      fill: "bg-amber-500",
      text: "text-amber-700",
      status: "near",
    };
  } else {
    return {
      bg: "bg-emerald-100/50",
      fill: "bg-emerald-500",
      text: "text-emerald-700",
      status: "under",
    };
  }
}

export function CalendarDayCell({ day, onClick, compact = false }: CalendarDayProps) {
  if (day.isPadding) {
    return (
      <div
        className={cn(
          "border-r border-b border-stone-100/50",
          compact ? "h-14" : "min-h-[80px]"
        )}
      />
    );
  }

  const progressPercent = Math.min(Math.max((day.spent / day.limit) * 100, 0), 100);
  const isTodayCell = isToday(day.date);

  // Check if day is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = day.date < today;

  const style = getStatusStyle(day.spent, day.limit, isPast);
  const isOver = day.remaining < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer transition-all duration-200 border-r border-b border-stone-100/50",
        "hover:z-10 hover:shadow-md hover:scale-[1.02]",
        compact ? "h-14 p-1.5" : "min-h-[80px] p-2",
        // Background color based on status
        isPast && day.spent > 0 && style.bg,
        !isPast && !isTodayCell && "bg-white hover:bg-stone-50/50",
        // Today highlight - prominent ring
        isTodayCell && "ring-2 ring-amber-400 bg-amber-50/60 z-10"
      )}
    >
      {/* Day number row */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-semibold tabular-nums",
            compact ? "text-[11px]" : "text-xs",
            isTodayCell && "text-amber-600",
            !isTodayCell && isPast && style.text,
            !isTodayCell && !isPast && "text-stone-400"
          )}
        >
          {day.day}
        </span>

        {/* Indicators */}
        <div className="flex items-center gap-0.5">
          {day.hasIncome && (
            <div
              className={cn(
                "rounded-full bg-emerald-500 flex items-center justify-center",
                compact ? "w-3.5 h-3.5" : "w-4 h-4"
              )}
              title={`+${formatCurrency(day.incomeAmount || 0, CURRENCY)}`}
            >
              <Banknote className={cn("text-white", compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
            </div>
          )}
          {day.hasBill && (
            <div
              className={cn(
                "rounded-full bg-rose-500 flex items-center justify-center",
                compact ? "w-3.5 h-3.5" : "w-4 h-4"
              )}
              title={`${day.billLabel}: ${formatCurrency(day.billAmount || 0, CURRENCY)}`}
            >
              <CreditCard className={cn("text-white", compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar - fills from bottom */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300",
          style.fill,
          "opacity-40"
        )}
        style={{ height: `${Math.min(progressPercent, 100)}%` }}
      />

      {/* Spent amount - only show on hover or for today/over budget */}
      {(isPast && day.spent > 0) && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-xs font-mono tabular-nums font-medium",
            style.text,
            compact && "text-[10px]"
          )}
        >
          {isOver && "-"}
          {formatCurrency(Math.abs(day.remaining), CURRENCY)}
        </div>
      )}

      {/* Today badge */}
      {isTodayCell && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "font-bold text-amber-600 uppercase tracking-wider",
              compact ? "text-[7px]" : "text-[8px]"
            )}
          >
            Today
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar/widget use
export function CalendarDayCellCompact({ day, onClick }: CalendarDayProps) {
  return <CalendarDayCell day={day} onClick={onClick} compact />;
}
