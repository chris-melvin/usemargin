"use client";

import type { RoadmapItem } from "@repo/database";
import { Card } from "@/components/ui/card";
import { VoteButton } from "./vote-button";
import { cn } from "@/lib/utils";

interface RoadmapCardProps {
  item: RoadmapItem;
  hasVoted: boolean;
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

const categoryColors: Record<string, string> = {
  Analytics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Budgeting: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Mobile: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Integrations: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  default: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400",
};

export function RoadmapCard({
  item,
  hasVoted,
  isAuthenticated,
  onAuthRequired,
}: RoadmapCardProps) {
  const categoryColor =
    categoryColors[item.category ?? ""] ?? categoryColors.default;

  return (
    <Card className="p-4 gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <VoteButton
          itemId={item.id}
          voteCount={item.vote_count}
          hasVoted={hasVoted}
          isAuthenticated={isAuthenticated}
          onAuthRequired={onAuthRequired}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
            {item.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {item.description}
          </p>

          {item.category && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                categoryColor
              )}
            >
              {item.category}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
