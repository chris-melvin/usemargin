"use client";

import { useState } from "react";
import type { RoadmapItem, RoadmapStatus } from "@repo/database";
import { RoadmapCard } from "./roadmap-card";
import { cn } from "@/lib/utils";

interface RoadmapBoardProps {
  items: Record<RoadmapStatus, RoadmapItem[]>;
  votedItemIds: string[];
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

const columns: { status: RoadmapStatus; title: string; color: string }[] = [
  {
    status: "under_consideration",
    title: "Under Consideration",
    color: "border-stone-300 dark:border-stone-600",
  },
  {
    status: "planned",
    title: "Planned",
    color: "border-blue-300 dark:border-blue-600",
  },
  {
    status: "in_progress",
    title: "In Progress",
    color: "border-amber-300 dark:border-amber-600",
  },
  {
    status: "completed",
    title: "Completed",
    color: "border-green-300 dark:border-green-600",
  },
];

export function RoadmapBoard({
  items,
  votedItemIds,
  isAuthenticated,
  onAuthRequired,
}: RoadmapBoardProps) {
  const [votedIds, setVotedIds] = useState<Set<string>>(
    new Set(votedItemIds)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map(({ status, title, color }) => (
        <div key={status} className="flex flex-col">
          <div
            className={cn(
              "flex items-center gap-2 mb-4 pb-2 border-b-2",
              color
            )}
          >
            <h2 className="font-semibold text-sm">{title}</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {(items[status] ?? []).length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {(items[status] ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No items yet
              </p>
            ) : (
              (items[status] ?? []).map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  hasVoted={votedIds.has(item.id)}
                  isAuthenticated={isAuthenticated}
                  onAuthRequired={onAuthRequired}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
