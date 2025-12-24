"use client";

import { useMemo, useCallback, useState } from "react";
import { Group } from "@visx/group";
import { Text } from "@visx/text";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { LinearGradient } from "@visx/gradient";
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from "d3-sankey";
import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CashFlowData, CashFlowNode, CashFlowLink } from "@/lib/types";

interface VisxSankeyProps {
  data: CashFlowData;
  width: number;
  height: number;
  nodeWidth?: number;
  nodePadding?: number;
}

type SankeyNodeExtended = SankeyNode<CashFlowNode, CashFlowLink>;
type SankeyLinkExtended = SankeyLink<CashFlowNode, CashFlowLink>;

// Color palette for node types
const NODE_COLORS: Record<string, string> = {
  income: "#10b981",     // emerald-500
  allocation: "#f59e0b", // amber-500
  category: "#8b5cf6",   // violet-500
  expense: "#78716c",    // stone-500
};

// Tooltip styles
const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: "white",
  border: "1px solid #e7e5e4",
  borderRadius: "12px",
  padding: "12px 16px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export function VisxSankey({
  data,
  width,
  height,
  nodeWidth = 20,
  nodePadding = 24,
}: VisxSankeyProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ type: "node" | "link"; data: SankeyNodeExtended | SankeyLinkExtended }>();

  // Build the Sankey layout
  const { nodes, links } = useMemo(() => {
    if (!data.nodes.length || !data.links.length) {
      return { nodes: [], links: [] };
    }

    const sankeyGenerator = sankey<CashFlowNode, CashFlowLink>()
      .nodeId((d) => d.id)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [40, 20],
        [width - 120, height - 20],
      ]);

    const graph = sankeyGenerator({
      nodes: data.nodes.map((d) => ({ ...d })),
      links: data.links.map((d) => ({ ...d })),
    });

    return {
      nodes: graph.nodes as SankeyNodeExtended[],
      links: graph.links as SankeyLinkExtended[],
    };
  }, [data, width, height, nodeWidth, nodePadding]);

  // Link path generator
  const linkPath = sankeyLinkHorizontal<SankeyNodeExtended, SankeyLinkExtended>();

  // Get node color
  const getNodeColor = useCallback((node: SankeyNodeExtended) => {
    return node.color || NODE_COLORS[node.type] || NODE_COLORS.expense;
  }, []);

  // Handle node hover
  const handleNodeMouseEnter = useCallback(
    (event: React.MouseEvent, node: SankeyNodeExtended) => {
      const coords = localPoint(event);
      setHoveredNode(node.id);
      showTooltip({
        tooltipData: { type: "node", data: node },
        tooltipLeft: coords?.x,
        tooltipTop: coords?.y,
      });
    },
    [showTooltip]
  );

  // Handle link hover
  const handleLinkMouseEnter = useCallback(
    (event: React.MouseEvent, link: SankeyLinkExtended, index: number) => {
      const coords = localPoint(event);
      setHoveredLink(index);
      showTooltip({
        tooltipData: { type: "link", data: link },
        tooltipLeft: coords?.x,
        tooltipTop: coords?.y,
      });
    },
    [showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setHoveredLink(null);
    hideTooltip();
  }, [hideTooltip]);

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        No cash flow data available
      </div>
    );
  }

  return (
    <div className="relative">
      <svg width={width} height={height}>
        {/* Gradient definitions */}
        {links.map((link, i) => {
          const sourceNode = link.source as SankeyNodeExtended;
          const targetNode = link.target as SankeyNodeExtended;
          return (
            <LinearGradient
              key={`gradient-${i}`}
              id={`link-gradient-${i}`}
              from={getNodeColor(sourceNode)}
              to={getNodeColor(targetNode)}
              fromOpacity={0.5}
              toOpacity={0.5}
            />
          );
        })}

        <Group>
          {/* Links */}
          {links.map((link, i) => {
            const path = linkPath(link);
            const isHovered = hoveredLink === i;
            const sourceNode = link.source as SankeyNodeExtended;
            const targetNode = link.target as SankeyNodeExtended;
            const isConnectedToHoveredNode =
              hoveredNode === sourceNode.id || hoveredNode === targetNode.id;

            return (
              <path
                key={`link-${i}`}
                d={path || ""}
                fill="none"
                stroke={`url(#link-gradient-${i})`}
                strokeWidth={Math.max(1, link.width || 0)}
                strokeOpacity={
                  hoveredNode
                    ? isConnectedToHoveredNode
                      ? 0.8
                      : 0.1
                    : isHovered
                    ? 0.8
                    : 0.4
                }
                onMouseEnter={(e) => handleLinkMouseEnter(e, link, i)}
                onMouseLeave={handleMouseLeave}
                style={{
                  cursor: "pointer",
                  transition: "stroke-opacity 0.2s ease",
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const nodeHeight = (node.y1 || 0) - (node.y0 || 0);
            const isHovered = hoveredNode === node.id;

            return (
              <g key={node.id}>
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={(node.x1 || 0) - (node.x0 || 0)}
                  height={nodeHeight}
                  fill={getNodeColor(node)}
                  fillOpacity={isHovered ? 1 : 0.85}
                  rx={4}
                  onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    cursor: "pointer",
                    transition: "fill-opacity 0.2s ease",
                  }}
                />
                {/* Node label */}
                <Text
                  x={
                    node.type === "income"
                      ? (node.x0 || 0) - 8
                      : (node.x1 || 0) + 8
                  }
                  y={(node.y0 || 0) + nodeHeight / 2}
                  textAnchor={node.type === "income" ? "end" : "start"}
                  verticalAnchor="middle"
                  fontSize={11}
                  fontWeight={500}
                  fill="#44403c"
                  style={{ pointerEvents: "none" }}
                >
                  {node.name}
                </Text>
              </g>
            );
          })}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={tooltipStyles}
        >
          {tooltipData.type === "node" ? (
            <div>
              <p className="text-sm font-semibold text-stone-800">
                {(tooltipData.data as SankeyNodeExtended).name}
              </p>
              <p className="text-sm text-stone-600">
                {formatCurrency(
                  (tooltipData.data as SankeyNodeExtended).value || 0,
                  CURRENCY
                )}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-stone-600">
                {((tooltipData.data as SankeyLinkExtended).source as SankeyNodeExtended).name}
                {" → "}
                {((tooltipData.data as SankeyLinkExtended).target as SankeyNodeExtended).name}
              </p>
              <p className="text-sm font-semibold text-stone-800">
                {formatCurrency(
                  (tooltipData.data as SankeyLinkExtended).value || 0,
                  CURRENCY
                )}
              </p>
            </div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}
