"use client";

import { useMemo, useCallback, useState } from "react";
import { Group } from "@visx/group";
import { Treemap, hierarchy, stratify, treemapSquarify } from "@visx/hierarchy";
import { scaleOrdinal } from "@visx/scale";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { SpendingNode } from "@/lib/types";

interface VisxTreemapProps {
  data: SpendingNode;
  width: number;
  height: number;
  onNodeClick?: (node: SpendingNode) => void;
}

// Color palette for categories
const CATEGORY_COLORS = [
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
];

// Tooltip styles
const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "white",
  border: "1px solid #e7e5e4",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

interface TreemapNodeData extends SpendingNode {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  depth?: number;
}

export function VisxTreemap({
  data,
  width,
  height,
  onNodeClick,
}: VisxTreemapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<TreemapNodeData>();

  // Build hierarchy
  const root = useMemo(() => {
    const h = hierarchy(data)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    return h;
  }, [data]);

  // Color scale
  const colorScale = useMemo(() => {
    const categories = root.children?.map((c) => c.data.name) || [];
    return scaleOrdinal({
      domain: categories,
      range: CATEGORY_COLORS,
    });
  }, [root]);

  // Get color for a node (inherit from parent category)
  const getNodeColor = useCallback(
    (node: TreemapNodeData, depth: number) => {
      if (node.color) return node.color;
      if (depth === 1) return colorScale(node.name);
      // For deeper nodes, use parent color with opacity
      return colorScale(node.name);
    },
    [colorScale]
  );

  // Handle node hover
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent, node: TreemapNodeData) => {
      const coords = localPoint(event);
      setHoveredNode(node.name);
      showTooltip({
        tooltipData: node,
        tooltipLeft: coords?.x,
        tooltipTop: coords?.y,
      });
    },
    [showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    hideTooltip();
  }, [hideTooltip]);

  if (!root.children?.length) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        No spending data available
      </div>
    );
  }

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Treemap
          root={root}
          size={[width - margin.left - margin.right, height - margin.top - margin.bottom]}
          tile={treemapSquarify}
          round
        >
          {(treemap) => (
            <Group left={margin.left} top={margin.top}>
              {treemap.descendants().map((node, i) => {
                const nodeWidth = (node.x1 || 0) - (node.x0 || 0);
                const nodeHeight = (node.y1 || 0) - (node.y0 || 0);
                const isLeaf = !node.children;
                const isHovered = hoveredNode === node.data.name;

                // Skip root node
                if (node.depth === 0) return null;

                // Only show leaf nodes or first-level categories
                if (!isLeaf && node.depth > 1) return null;

                const color = getNodeColor(node.data, node.depth);
                const showLabel = nodeWidth > 40 && nodeHeight > 30;
                const showAmount = nodeWidth > 60 && nodeHeight > 45;

                return (
                  <g key={`node-${i}`}>
                    <rect
                      x={node.x0}
                      y={node.y0}
                      width={nodeWidth}
                      height={nodeHeight}
                      fill={color}
                      fillOpacity={isHovered ? 1 : isLeaf ? 0.85 : 0.7}
                      stroke="white"
                      strokeWidth={isLeaf ? 1 : 2}
                      rx={node.depth === 1 ? 8 : 4}
                      style={{
                        cursor: "pointer",
                        transition: "fill-opacity 0.15s ease",
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, node.data)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => onNodeClick?.(node.data)}
                    />

                    {/* Label */}
                    {showLabel && (
                      <text
                        x={(node.x0 || 0) + nodeWidth / 2}
                        y={(node.y0 || 0) + (showAmount ? nodeHeight / 2 - 6 : nodeHeight / 2)}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize={node.depth === 1 ? 12 : 10}
                        fontWeight={node.depth === 1 ? 600 : 500}
                        fill="white"
                        style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        {node.data.name.length > 12
                          ? `${node.data.name.slice(0, 10)}...`
                          : node.data.name}
                      </text>
                    )}

                    {/* Amount */}
                    {showAmount && (
                      <text
                        x={(node.x0 || 0) + nodeWidth / 2}
                        y={(node.y0 || 0) + nodeHeight / 2 + 10}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fontSize={10}
                        fontWeight={500}
                        fill="rgba(255,255,255,0.9)"
                        style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        {formatCurrency(node.value || 0, CURRENCY)}
                      </text>
                    )}
                  </g>
                );
              })}
            </Group>
          )}
        </Treemap>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={tooltipStyles}
        >
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {tooltipData.name}
            </p>
            <p className="text-sm text-stone-600">
              {formatCurrency(tooltipData.value || 0, CURRENCY)}
            </p>
            {root.value && (
              <p className="text-xs text-stone-400">
                {(((tooltipData.value || 0) / root.value) * 100).toFixed(1)}% of total
              </p>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
