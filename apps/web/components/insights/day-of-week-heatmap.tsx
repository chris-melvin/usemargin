"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { DayOfWeekSpending } from "@/lib/insights/types";

interface DayOfWeekHeatmapProps {
  data: DayOfWeekSpending[];
  dailyLimit: number;
  isBudgetMode: boolean;
}

function getIntensityClass(
  average: number,
  maxAverage: number,
  dailyLimit: number,
  isBudgetMode: boolean
): string {
  if (average === 0) return "bg-neutral-50";

  if (isBudgetMode && average > dailyLimit) {
    const ratio = average / maxAverage;
    if (ratio > 0.75) return "bg-rose-200";
    return "bg-rose-100";
  }

  const ratio = maxAverage > 0 ? average / maxAverage : 0;
  if (ratio > 0.75) return "bg-teal-400 text-white";
  if (ratio > 0.5) return "bg-teal-200";
  if (ratio > 0.25) return "bg-teal-100";
  return "bg-teal-50";
}

export function DayOfWeekHeatmap({
  data,
  dailyLimit,
  isBudgetMode,
}: DayOfWeekHeatmapProps) {
  const maxAverage = Math.max(...data.map((d) => d.average));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Spending by Day
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {data.map((day) => (
            <div
              key={day.dayIndex}
              className={`flex flex-col items-center rounded-lg p-2 ${getIntensityClass(
                day.average,
                maxAverage,
                dailyLimit,
                isBudgetMode
              )}`}
            >
              <span className="text-[10px] font-medium opacity-70">
                {day.dayLabel}
              </span>
              <span className="text-xs font-semibold tabular-nums mt-0.5">
                {day.average > 0
                  ? formatCurrency(Math.round(day.average), CURRENCY)
                  : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
