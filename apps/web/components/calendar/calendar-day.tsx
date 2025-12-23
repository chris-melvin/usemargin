"use client";

import { cn, formatCurrency, isToday } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CURRENCY } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";

interface CalendarDayProps {
  day: CalendarDay;
  onClick: () => void;
}

export function CalendarDayCell({ day, onClick }: CalendarDayProps) {
  if (day.isPadding) {
    return <div className="min-h-[120px] p-3 border-r border-b border-stone-50 bg-stone-50/20" />;
  }

  const isOver = day.remaining < 0;
  const progressPercent = Math.min(Math.max((day.spent / day.limit) * 100, 0), 100);
  const isTodayCell = isToday(day.date);

  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[120px] p-3 border-r border-b border-stone-50 relative cursor-pointer transition-colors hover:bg-stone-50",
        isTodayCell && "bg-amber-50/30"
      )}
    >
      {/* Day number */}
      <div className="flex justify-between items-start mb-2">
        <span
          className={cn(
            "text-xs font-medium",
            isOver ? "text-rose-400" : "text-stone-400"
          )}
        >
          {day.day}
        </span>
      </div>

      {/* Remaining amount */}
      <div className="text-center mt-2">
        <div
          className={cn(
            "text-sm font-mono mb-2",
            isOver ? "text-rose-600 font-bold" : "text-stone-800"
          )}
        >
          {isOver ? "-" : ""}
          {formatCurrency(day.remaining, CURRENCY)}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              day.spent > day.limit
                ? "bg-rose-500"
                : day.spent === 0
                  ? "bg-emerald-300"
                  : "bg-stone-900"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
