"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { WeekdayWeekendSplit } from "@/lib/insights/types";

interface WeekdayWeekendSplitCardProps {
  data: WeekdayWeekendSplit;
}

export function WeekdayWeekendSplitCard({ data }: WeekdayWeekendSplitCardProps) {
  const maxAvg = Math.max(data.weekdayAvg, data.weekendAvg, 1);
  const weekdayWidth = (data.weekdayAvg / maxAvg) * 100;
  const weekendWidth = (data.weekendAvg / maxAvg) * 100;

  const weekdayHigher = data.higherOn === "weekday";
  const weekendHigher = data.higherOn === "weekend";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Weekday vs Weekend
        </h3>
      </div>
      <div className="p-4 space-y-3">
        {/* Two-column averages */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
              Weekdays
            </p>
            <p
              className={`text-lg font-bold tabular-nums ${weekdayHigher ? "text-teal-600" : "text-neutral-500"}`}
            >
              {formatCurrency(data.weekdayAvg, CURRENCY)}
            </p>
            <p className="text-[10px] text-neutral-400">/day avg</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5">
              Weekends
            </p>
            <p
              className={`text-lg font-bold tabular-nums ${weekendHigher ? "text-teal-600" : "text-neutral-500"}`}
            >
              {formatCurrency(data.weekendAvg, CURRENCY)}
            </p>
            <p className="text-[10px] text-neutral-400">/day avg</p>
          </div>
        </div>

        {/* Comparison bars */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 w-7 shrink-0">
              M-F
            </span>
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${weekdayHigher ? "bg-teal-500" : "bg-neutral-300"}`}
                style={{ width: `${weekdayWidth}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 w-7 shrink-0">
              S-S
            </span>
            <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${weekendHigher ? "bg-teal-500" : "bg-neutral-300"}`}
                style={{ width: `${weekendWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Diff summary */}
        {data.higherOn !== "equal" && (
          <p className="text-[11px] text-neutral-400 text-center">
            {data.percentDiff}% higher on {data.higherOn === "weekend" ? "weekends" : "weekdays"}
          </p>
        )}
      </div>
    </div>
  );
}
