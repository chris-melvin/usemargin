"use client";

import { cn, formatCurrency, isToday } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CalendarDay } from "@/lib/types";
import { Banknote, CreditCard } from "lucide-react";
import { BucketDots } from "./bucket-dots";

interface CalendarDayProps {
  day: CalendarDay;
  onClick: () => void;
  compact?: boolean;
  isSelected?: boolean;
}

// Get status color based on spending percentage
// Now uses dailySpendingSpent (bucket-aware) instead of total spent
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

export function CalendarDayCell({
  day,
  onClick,
  compact = false,
  isSelected = false,
}: CalendarDayProps) {
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

  // Use dailySpendingSpent for status (bucket-aware) - fallback to spent for backwards compatibility
  const statusSpent = day.dailySpendingSpent ?? day.spent;
  const progressPercent = Math.min(
    Math.max((statusSpent / day.limit) * 100, 0),
    100
  );
  const isTodayCell = isToday(day.date);

  // Check if day is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = day.date < today;

  // Status style based on daily-spending bucket only
  const style = getStatusStyle(statusSpent, day.limit, isPast);

  // Check if over daily limit (based on daily-spending bucket)
  const isOver = statusSpent > day.limit;

  // Transaction count (only show if > 0)
  const txCount = day.transactionCount ?? 0;

  return (
    <div
      onClick={onClick}
      {...(isTodayCell ? { "data-onboarding-target": "calendar-today" } : {})}
      className={cn(
        "relative cursor-pointer transition-all duration-200 border-r border-b border-neutral-100/50",
        "active:scale-95 sm:hover:z-10 sm:hover:shadow-md sm:hover:scale-[1.02]",
        // Square aspect ratio on all screens
        compact ? "h-14 p-1" : "aspect-square p-1.5 sm:p-2",
        // Background color based on status (using dailySpendingSpent)
        isPast && statusSpent > 0 && style.bg,
        !isPast && !isTodayCell && !isSelected && "bg-white sm:hover:bg-neutral-50/50",
        // Today highlight - prominent ring (teal for brand)
        isTodayCell && !isSelected && "ring-2 ring-teal-400 ring-inset bg-teal-50/60 z-10",
        // Selected state - blue ring (takes priority over today on desktop)
        isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50/60 z-20"
      )}
    >
      {/* Day number row */}
      <div className="flex items-center justify-between relative z-10">
        <span
          className={cn(
            "font-semibold tabular-nums leading-none",
            compact ? "text-[11px]" : "text-[11px] sm:text-xs",
            isTodayCell && "text-teal-600",
            !isTodayCell && isPast && statusSpent > 0 && style.text,
            !isTodayCell && isPast && statusSpent === 0 && "text-neutral-400",
            !isTodayCell && !isPast && "text-neutral-400"
          )}
        >
          {day.day}
        </span>

        {/* Right side: transaction count + income/bill indicators */}
        <div className="flex items-center gap-0.5">
          {/* Transaction count badge */}
          {txCount > 1 && (
            <span
              className={cn(
                "font-medium tabular-nums leading-none",
                compact ? "text-[8px]" : "text-[8px] sm:text-[9px]",
                isPast && statusSpent > 0 ? style.text : "text-neutral-400",
                "opacity-70"
              )}
            >
              {txCount}
            </span>
          )}

          {/* Income indicator */}
          {day.hasIncome && (
            <div
              className={cn(
                "rounded-full bg-emerald-500 flex items-center justify-center shadow-sm",
                compact ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"
              )}
              title={`+${formatCurrency(day.incomeAmount || 0, CURRENCY)}`}
            >
              <Banknote
                className={cn(
                  "text-white",
                  compact ? "w-1.5 h-1.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2"
                )}
              />
            </div>
          )}

          {/* Bill indicator */}
          {day.hasBill && (
            <div
              className={cn(
                "rounded-full bg-rose-500 flex items-center justify-center shadow-sm",
                compact ? "w-3 h-3" : "w-3 h-3 sm:w-3.5 sm:h-3.5"
              )}
              title={`${day.billLabel}: ${formatCurrency(day.billAmount || 0, CURRENCY)}`}
            >
              <CreditCard
                className={cn(
                  "text-white",
                  compact ? "w-1.5 h-1.5" : "w-1.5 h-1.5 sm:w-2 sm:h-2"
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Progress bar - fills from bottom (based on daily-spending bucket) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300 rounded-b-sm",
          style.fill,
          "opacity-30"
        )}
        style={{ height: `${Math.min(progressPercent, 100)}%` }}
      />

      {/* Spent amount - centered, shows TOTAL spent (all buckets) */}
      {isPast && day.spent > 0 && (
        <div
          className={cn(
            "absolute inset-x-0 flex flex-col items-center justify-center z-10",
            compact ? "top-5 bottom-3" : "top-5 sm:top-6 bottom-3 sm:bottom-4"
          )}
        >
          <span
            className={cn(
              "font-mono tabular-nums font-semibold leading-none",
              compact ? "text-[10px]" : "text-[10px] sm:text-xs",
              style.text
            )}
          >
            {formatCurrency(day.spent, CURRENCY)}
          </span>
          {/* Show remaining only if over limit */}
          {isOver && (
            <span
              className={cn(
                "font-mono tabular-nums leading-none mt-0.5",
                compact ? "text-[7px]" : "text-[7px] sm:text-[8px]",
                "text-rose-500 opacity-80"
              )}
            >
              -{formatCurrency(statusSpent - day.limit, CURRENCY)}
            </span>
          )}
        </div>
      )}

      {/* Bucket indicator dots - bottom of cell */}
      {day.bucketSummary && day.bucketSummary.length > 0 && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-10",
            compact ? "bottom-0.5" : "bottom-1 sm:bottom-1.5"
          )}
        >
          <BucketDots
            buckets={day.bucketSummary}
            maxDots={compact ? 3 : 4}
            compact={compact}
          />
        </div>
      )}

      {/* Today badge - only show if no bucket dots */}
      {isTodayCell && (!day.bucketSummary || day.bucketSummary.length === 0) && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-10",
            compact ? "bottom-0.5" : "bottom-1 sm:bottom-1.5"
          )}
        >
          <span
            className={cn(
              "font-bold text-teal-600 uppercase tracking-wider",
              compact ? "text-[6px]" : "text-[6px] sm:text-[7px]"
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
