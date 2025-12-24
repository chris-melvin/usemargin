"use client";

import { useMemo, useCallback } from "react";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { HeatmapCell } from "@/lib/types";

interface VisxHeatmapProps {
  data: HeatmapCell[];
  width: number;
  height: number;
  onCellClick?: (date: string) => void;
}

// Day labels
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Month labels
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Tooltip styles
const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "white",
  border: "1px solid #e7e5e4",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

// Color scale: stone-100 → amber-500 (low → high spending)
const colorMin = "#f5f5f4"; // stone-100
const colorMax = "#f59e0b"; // amber-500

export function VisxHeatmap({
  data,
  width,
  height,
  onCellClick,
}: VisxHeatmapProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<HeatmapCell>();

  // Organize data by week
  const { bins, maxAmount, weeks } = useMemo(() => {
    if (!data.length) {
      return { bins: [], maxAmount: 0, weeks: [] };
    }

    // Group by week
    const weekMap = new Map<number, HeatmapCell[]>();
    let maxAmt = 0;

    data.forEach((cell) => {
      if (!weekMap.has(cell.week)) {
        weekMap.set(cell.week, []);
      }
      weekMap.get(cell.week)!.push(cell);
      if (cell.amount > maxAmt) maxAmt = cell.amount;
    });

    // Convert to bins format (weeks as columns, days as rows)
    const weekNumbers = Array.from(weekMap.keys()).sort((a, b) => a - b);
    const binData = weekNumbers.map((week) => {
      const weekCells = weekMap.get(week)!;
      return {
        week,
        bins: DAYS.map((_, dayIndex) => {
          const cell = weekCells.find((c) => c.dayOfWeek === dayIndex);
          return cell || null;
        }),
      };
    });

    return { bins: binData, maxAmount: maxAmt, weeks: weekNumbers };
  }, [data]);

  // Dimensions
  const margin = { top: 30, right: 20, bottom: 20, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const cellWidth = Math.max(8, Math.min(16, innerWidth / Math.max(weeks.length, 1)));
  const cellHeight = Math.max(8, Math.min(16, innerHeight / 7));
  const gap = 2;

  // Color scale
  const colorScale = useMemo(
    () =>
      scaleLinear<string>({
        domain: [0, maxAmount],
        range: [colorMin, colorMax],
      }),
    [maxAmount]
  );

  // Get month label for a week
  const getMonthLabel = useCallback((weekIndex: number) => {
    const cell = bins[weekIndex]?.bins.find((c) => c !== null);
    if (!cell) return "";
    const date = new Date(cell.date);
    // Only show month at the start of each month
    if (date.getDate() <= 7) {
      return MONTHS[date.getMonth()];
    }
    return "";
  }, [bins]);

  // Handle cell hover
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent, cell: HeatmapCell) => {
      const coords = localPoint(event);
      showTooltip({
        tooltipData: cell,
        tooltipLeft: coords?.x,
        tooltipTop: coords?.y,
      });
    },
    [showTooltip]
  );

  if (!bins.length) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        No spending data available
      </div>
    );
  }

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Day labels (Y-axis) */}
          {DAYS.map((day, i) => (
            <text
              key={day}
              x={-8}
              y={i * (cellHeight + gap) + cellHeight / 2}
              textAnchor="end"
              alignmentBaseline="middle"
              fontSize={9}
              fill="#a8a29e"
              fontWeight={500}
            >
              {day}
            </text>
          ))}

          {/* Month labels (X-axis) */}
          {bins.map((weekData, weekIndex) => {
            const monthLabel = getMonthLabel(weekIndex);
            if (!monthLabel) return null;
            return (
              <text
                key={`month-${weekIndex}`}
                x={weekIndex * (cellWidth + gap) + cellWidth / 2}
                y={-10}
                textAnchor="middle"
                fontSize={9}
                fill="#78716c"
                fontWeight={600}
              >
                {monthLabel}
              </text>
            );
          })}

          {/* Heatmap cells */}
          {bins.map((weekData, weekIndex) =>
            weekData.bins.map((cell, dayIndex) => {
              if (!cell) {
                return (
                  <rect
                    key={`empty-${weekIndex}-${dayIndex}`}
                    x={weekIndex * (cellWidth + gap)}
                    y={dayIndex * (cellHeight + gap)}
                    width={cellWidth}
                    height={cellHeight}
                    fill="#fafaf9"
                    rx={2}
                  />
                );
              }

              return (
                <rect
                  key={`cell-${cell.date}`}
                  x={weekIndex * (cellWidth + gap)}
                  y={dayIndex * (cellHeight + gap)}
                  width={cellWidth}
                  height={cellHeight}
                  fill={colorScale(cell.amount)}
                  rx={2}
                  style={{ cursor: "pointer", transition: "opacity 0.15s ease" }}
                  onMouseEnter={(e) => handleMouseEnter(e, cell)}
                  onMouseLeave={hideTooltip}
                  onClick={() => onCellClick?.(cell.date)}
                />
              );
            })
          )}
        </Group>

        {/* Legend */}
        <Group left={width - margin.right - 120} top={height - 16}>
          <text x={0} y={0} fontSize={9} fill="#a8a29e">
            Less
          </text>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <rect
              key={`legend-${i}`}
              x={28 + i * 14}
              y={-8}
              width={12}
              height={12}
              fill={colorScale(t * maxAmount)}
              rx={2}
            />
          ))}
          <text x={102} y={0} fontSize={9} fill="#a8a29e">
            More
          </text>
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={tooltipStyles}
        >
          <div>
            <p className="text-xs text-stone-500">
              {new Date(tooltipData.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-sm font-semibold text-stone-800">
              {formatCurrency(tooltipData.amount, CURRENCY)}
            </p>
            <p className="text-xs text-stone-400">
              {tooltipData.count} expense{tooltipData.count !== 1 ? "s" : ""}
            </p>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
