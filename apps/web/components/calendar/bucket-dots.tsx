"use client";

import { cn } from "@/lib/utils";
import type { BucketSpendingSummary } from "@/lib/types";

interface BucketDotsProps {
  buckets: BucketSpendingSummary[];
  maxDots?: number;
  compact?: boolean;
}

/**
 * Displays colored dots representing which buckets were used for spending.
 * Each dot's color corresponds to the bucket's assigned color.
 * Sorted by amount (highest first) with overflow indicator.
 */
export function BucketDots({
  buckets,
  maxDots = 4,
  compact = false,
}: BucketDotsProps) {
  if (buckets.length === 0) return null;

  const displayBuckets = buckets.slice(0, maxDots);
  const overflow = buckets.length - maxDots;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "gap-[2px]" : "gap-1"
      )}
    >
      {displayBuckets.map((bucket, idx) => (
        <div
          key={`${bucket.bucketId}-${idx}`}
          className={cn(
            "rounded-full transition-transform duration-200",
            "ring-1 ring-white/50",
            compact ? "w-[5px] h-[5px]" : "w-[6px] h-[6px] sm:w-2 sm:h-2"
          )}
          style={{ backgroundColor: bucket.bucketColor }}
          title={`${bucket.bucketName}: ${bucket.transactionCount} transaction${bucket.transactionCount > 1 ? "s" : ""}`}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "font-medium text-neutral-400 tabular-nums",
            compact ? "text-[6px] ml-0.5" : "text-[7px] sm:text-[8px] ml-0.5"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
