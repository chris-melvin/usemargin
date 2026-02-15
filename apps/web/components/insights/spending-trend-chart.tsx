"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { DailySpending, RollingAveragePoint } from "@/lib/insights/types";

interface ChartDataPoint extends DailySpending {
  average?: number | null;
}

interface SpendingTrendChartProps {
  data: DailySpending[];
  rollingAverage: RollingAveragePoint[];
  dailyLimit: number;
  isBudgetMode: boolean;
}

function formatXLabel(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailySpending }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  const d = new Date(data.date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 tabular-nums">
        {formatCurrency(data.amount, CURRENCY)}
      </p>
    </div>
  );
}

export function SpendingTrendChart({
  data,
  rollingAverage,
  dailyLimit,
  isBudgetMode,
}: SpendingTrendChartProps) {
  // Show label every 5th day for 30-day view, every day for 7-day
  const interval = data.length > 10 ? 4 : 0;

  // Merge rolling average into chart data
  const avgMap = new Map(rollingAverage.map((p) => [p.date, p.average]));
  const chartData: ChartDataPoint[] = data.map((d) => ({
    ...d,
    average: avgMap.get(d.date) ?? null,
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">
          Spending Trend
        </h3>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
            <XAxis
              dataKey="date"
              tickFormatter={formatXLabel}
              interval={interval}
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            {isBudgetMode && (
              <ReferenceLine
                y={dailyLimit}
                stroke="#e5e5e5"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={
                    entry.isToday
                      ? "#E87356"
                      : isBudgetMode && entry.overBudget
                        ? "#FDA4AF"
                        : "#1A9E9E"
                  }
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="average"
              stroke="#a3a3a3"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
