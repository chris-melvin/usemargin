"use client";

import { useState, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleVote } from "@/actions/roadmap";

interface VoteButtonProps {
  itemId: string;
  voteCount: number;
  hasVoted: boolean;
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

export function VoteButton({
  itemId,
  voteCount,
  hasVoted,
  isAuthenticated,
  onAuthRequired,
}: VoteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticVoted, setOptimisticVoted] = useState(hasVoted);
  const [optimisticCount, setOptimisticCount] = useState(voteCount);

  const handleClick = () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }

    // Optimistic update
    setOptimisticVoted(!optimisticVoted);
    setOptimisticCount(optimisticVoted ? optimisticCount - 1 : optimisticCount + 1);

    startTransition(async () => {
      const result = await toggleVote(itemId);

      if (!result.success) {
        // Rollback on error
        setOptimisticVoted(optimisticVoted);
        setOptimisticCount(voteCount);
      } else {
        // Update with actual values from server
        setOptimisticVoted(result.data.voted);
        setOptimisticCount(result.data.voteCount);
      }
    });
  };

  return (
    <Button
      variant={optimisticVoted ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex flex-col items-center gap-0.5 h-auto py-2 px-3 min-w-[3.5rem]",
        optimisticVoted && "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
      )}
    >
      <ChevronUp
        className={cn(
          "h-4 w-4 transition-transform",
          optimisticVoted && "text-white"
        )}
      />
      <span className="text-xs font-semibold tabular-nums">
        {optimisticCount}
      </span>
    </Button>
  );
}
