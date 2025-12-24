"use client";

import { useMemo } from "react";
import {
  XYChart,
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  AnimatedAreaSeries,
  Tooltip,
  buildChartTheme,
} from "@visx/xychart";
import { curveMonotoneX } from "@visx/curve";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { NetWorthSnapshot } from "@/lib/types";

interface VisxLineChartProps {
  data: NetWorthSnapshot[];
  width: number;
  height: number;
  showAssets?: boolean;
  showLiabilities?: boolean;
  showNetWorth?: boolean;
}

// Custom theme matching the app's stone/amber palette
const customTheme = buildChartTheme({
  backgroundColor: "transparent",
  colors: ["#10b981", "#ef4444", "#f59e0b"], // emerald, red, amber
  gridColor: "#e7e5e4",
  gridColorDark: "#d6d3d1",
  svgLabelBig: { fill: "#44403c", fontWeight: 600 },
  svgLabelSmall: { fill: "#78716c", fontSize: 10 },
  tickLength: 4,
});

// Accessors
const getDate = (d: NetWorthSnapshot) => new Date(d.date);
const getAssets = (d: NetWorthSnapshot) => d.totalAssets;
const getLiabilities = (d: NetWorthSnapshot) => d.totalLiabilities;
const getNetWorth = (d: NetWorthSnapshot) => d.netWorth;

export function VisxLineChart({
  data,
  width,
  height,
  showAssets = true,
  showLiabilities = true,
  showNetWorth = true,
}: VisxLineChartProps) {
  // Format date for axis
  const formatDate = useMemo(() => {
    return (date: Date) => {
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };
  }, []);

  // Calculate min/max for Y axis
  const yDomain = useMemo(() => {
    if (!data.length) return [0, 100000];

    let min = Infinity;
    let max = -Infinity;

    data.forEach((d) => {
      if (showAssets && d.totalAssets > max) max = d.totalAssets;
      if (showLiabilities && d.totalLiabilities > max) max = d.totalLiabilities;
      if (showNetWorth && d.netWorth > max) max = d.netWorth;
      if (showAssets && d.totalAssets < min) min = d.totalAssets;
      if (showLiabilities && d.totalLiabilities < min) min = d.totalLiabilities;
      if (showNetWorth && d.netWorth < min) min = d.netWorth;
    });

    // Add 10% padding
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [data, showAssets, showLiabilities, showNetWorth]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        No net worth data available
      </div>
    );
  }

  const margin = { top: 20, right: 30, bottom: 40, left: 60 };

  return (
    <div className="relative">
      <XYChart
        theme={customTheme}
        width={width}
        height={height}
        margin={margin}
        xScale={{ type: "time" }}
        yScale={{ type: "linear", domain: yDomain, nice: true }}
      >
        <AnimatedGrid
          columns={false}
          numTicks={5}
          lineStyle={{ stroke: "#e7e5e4", strokeDasharray: "4 4" }}
        />

        {/* X Axis */}
        <AnimatedAxis
          orientation="bottom"
          numTicks={Math.min(6, data.length)}
          tickFormat={(d) => formatDate(d as Date)}
          tickLabelProps={() => ({
            fill: "#78716c",
            fontSize: 10,
            textAnchor: "middle",
            dy: 4,
          })}
        />

        {/* Y Axis */}
        <AnimatedAxis
          orientation="left"
          numTicks={5}
          tickFormat={(d) => `₱${((d as number) / 1000).toFixed(0)}k`}
          tickLabelProps={() => ({
            fill: "#78716c",
            fontSize: 10,
            textAnchor: "end",
            dx: -4,
          })}
        />

        {/* Assets Area + Line */}
        {showAssets && (
          <>
            <AnimatedAreaSeries
              dataKey="Assets"
              data={data}
              xAccessor={getDate}
              yAccessor={getAssets}
              fillOpacity={0.1}
              curve={curveMonotoneX}
            />
            <AnimatedLineSeries
              dataKey="Assets"
              data={data}
              xAccessor={getDate}
              yAccessor={getAssets}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          </>
        )}

        {/* Liabilities Line */}
        {showLiabilities && (
          <AnimatedLineSeries
            dataKey="Liabilities"
            data={data}
            xAccessor={getDate}
            yAccessor={getLiabilities}
            strokeWidth={2}
            stroke="#ef4444"
            curve={curveMonotoneX}
          />
        )}

        {/* Net Worth Line */}
        {showNetWorth && (
          <AnimatedLineSeries
            dataKey="Net Worth"
            data={data}
            xAccessor={getDate}
            yAccessor={getNetWorth}
            strokeWidth={3}
            stroke="#f59e0b"
            curve={curveMonotoneX}
          />
        )}

        {/* Tooltip */}
        <Tooltip
          snapTooltipToDatumX
          snapTooltipToDatumY
          showVerticalCrosshair
          showSeriesGlyphs
          glyphStyle={{ fill: "#f59e0b", strokeWidth: 2 }}
          renderTooltip={({ tooltipData }) => {
            const datum = tooltipData?.nearestDatum?.datum as NetWorthSnapshot | undefined;
            if (!datum) return null;

            return (
              <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-lg">
                <p className="text-xs text-stone-500 mb-2">
                  {new Date(datum.date).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {showAssets && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-stone-600">Assets:</span>
                    <span className="text-xs font-semibold text-stone-800">
                      {formatCurrency(datum.totalAssets, CURRENCY)}
                    </span>
                  </div>
                )}
                {showLiabilities && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-stone-600">Liabilities:</span>
                    <span className="text-xs font-semibold text-stone-800">
                      {formatCurrency(datum.totalLiabilities, CURRENCY)}
                    </span>
                  </div>
                )}
                {showNetWorth && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-stone-600">Net Worth:</span>
                    <span className="text-xs font-bold text-amber-600">
                      {formatCurrency(datum.netWorth, CURRENCY)}
                    </span>
                  </div>
                )}
              </div>
            );
          }}
        />
      </XYChart>

      {/* Legend */}
      <div className="absolute bottom-2 right-4 flex items-center gap-4">
        {showAssets && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-emerald-500" />
            <span className="text-[10px] text-stone-500">Assets</span>
          </div>
        )}
        {showLiabilities && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-red-500" />
            <span className="text-[10px] text-stone-500">Liabilities</span>
          </div>
        )}
        {showNetWorth && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber-500" style={{ height: 3 }} />
            <span className="text-[10px] text-stone-500 font-medium">Net Worth</span>
          </div>
        )}
      </div>
    </div>
  );
}
