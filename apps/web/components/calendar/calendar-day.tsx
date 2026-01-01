"use client";

import { cn, formatCurrency, isToday } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import { Banknote, CreditCard } from "lucide-react";

interface CalendarDayProps {
  day: CalendarDay;
  onClick: () => void;
  compact?: boolean;
  isSelected?: boolean;
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
      bg: "bg-neutral-50/30",
      fill: "bg-neutral-200",
      text: "text-neutral-500",
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

export function CalendarDayCell({ day, onClick, compact = false, isSelected = false }: CalendarDayProps) {
  if (day.isPadding) {
    return (
      <div
        className={cn(
          "aspect-square border-r border-b border-stone-100/50",
          compact && "aspect-auto h-14"
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
      {...(isTodayCell ? { "data-onboarding-target": "calendar-today" } : {})}
      className={cn(
        "relative cursor-pointer transition-all duration-200 border-r border-b border-neutral-100/50",
        "active:scale-95 sm:hover:z-10 sm:hover:shadow-md sm:hover:scale-[1.02]",
        // Square aspect ratio on all screens
        compact ? "h-14 p-1.5" : "aspect-square p-1.5 sm:p-2",
        // Background color based on status
        isPast && day.spent > 0 && style.bg,
        !isPast && !isTodayCell && !isSelected && "bg-white sm:hover:bg-neutral-50/50",
        // Today highlight - prominent ring (teal for brand)
        isTodayCell && !isSelected && "ring-2 ring-teal-400 ring-inset bg-teal-50/60 z-10",
        // Selected state - blue ring (takes priority over today on desktop)
        isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50/60 z-20"
      )}
    >
      {/* Day number row */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-semibold tabular-nums",
            compact ? "text-[11px]" : "text-[11px] sm:text-xs",
            isTodayCell && "text-amber-600",
            !isTodayCell && isPast && style.text,
            !isTodayCell && !isPast && "text-neutral-400"
          )}
        >
          {day.day}
        </span>

        {/* Indicators - smaller on mobile */}
        <div className="flex items-center gap-0.5">
          {day.hasIncome && (
            <div
              className={cn(
                "rounded-full bg-emerald-500 flex items-center justify-center",
                compact ? "w-3.5 h-3.5" : "w-3 h-3 sm:w-4 sm:h-4"
              )}
              title={`+${formatCurrency(day.incomeAmount || 0, CURRENCY)}`}
            >
              <Banknote className={cn("text-white", compact ? "w-2 h-2" : "w-1.5 h-1.5 sm:w-2.5 sm:h-2.5")} />
            </div>
          )}
          {day.hasBill && (
            <div
              className={cn(
                "rounded-full bg-rose-500 flex items-center justify-center",
                compact ? "w-3.5 h-3.5" : "w-3 h-3 sm:w-4 sm:h-4"
              )}
              title={`${day.billLabel}: ${formatCurrency(day.billAmount || 0, CURRENCY)}`}
            >
              <CreditCard className={cn("text-white", compact ? "w-2 h-2" : "w-1.5 h-1.5 sm:w-2.5 sm:h-2.5")} />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar - fills from bottom */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-b-sm",
          style.fill,
          "opacity-40"
        )}
        style={{ height: `${Math.min(progressPercent, 100)}%` }}
      />

      {/* Spent amount - centered, responsive text */}
      {(isPast && day.spent > 0) && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pt-3 sm:pt-4",
            "text-[10px] sm:text-xs font-mono tabular-nums font-medium",
            style.text,
            compact && "text-[10px]"
          )}
        >
          {isOver && "-"}
          {formatCurrency(Math.abs(day.remaining), CURRENCY)}
        </div>
      )}

      {/* Today badge - smaller on mobile */}
      {isTodayCell && (
        <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "font-bold text-amber-600 uppercase tracking-wider",
              compact ? "text-[7px]" : "text-[6px] sm:text-[8px]"
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
