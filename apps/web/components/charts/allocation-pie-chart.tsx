"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";

interface AllocationData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  [key: string]: string | number;
}

interface AllocationPieChartProps {
  data: AllocationData[];
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: AllocationData }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-stone-200">
      <p className="text-sm font-semibold text-stone-800">{data.name}</p>
      <p className="text-sm text-stone-600">
        {formatCurrency(data.value, CURRENCY)}
        <span className="text-stone-400 ml-1">({data.percentage.toFixed(1)}%)</span>
      </p>
    </div>
  );
}

// Custom legend component
function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string; payload: AllocationData }>;
}) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-stone-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AllocationPieChart({
  data,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90,
}: AllocationPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  );
}
