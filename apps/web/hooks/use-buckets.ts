"use client";

import { useMemo, useCallback } from "react";
import type { BudgetBucket } from "@repo/database";

interface UseBucketsOptions {
  initialBuckets?: BudgetBucket[];
}

interface UseBucketsReturn {
  buckets: BudgetBucket[];
  defaultBucket: BudgetBucket | null;
  findBySlug: (slug: string) => BudgetBucket | undefined;
  findById: (id: string) => BudgetBucket | undefined;
}

/**
 * Hook for managing budget buckets
 * Provides bucket lookup and default bucket resolution
 */
export function useBuckets(options: UseBucketsOptions = {}): UseBucketsReturn {
  const { initialBuckets = [] } = options;

  // Sort buckets by sort_order
  const buckets = useMemo(
    () => [...initialBuckets].sort((a, b) => a.sort_order - b.sort_order),
    [initialBuckets]
  );

  // Find the default bucket (is_default = true)
  const defaultBucket = useMemo(
    () => buckets.find((b) => b.is_default) ?? buckets[0] ?? null,
    [buckets]
  );

  // Lookup by slug (e.g., "flex", "daily-spending")
  const findBySlug = useCallback(
    (slug: string): BudgetBucket | undefined => {
      const normalizedSlug = slug.toLowerCase().trim();
      return buckets.find((b) => b.slug.toLowerCase() === normalizedSlug);
    },
    [buckets]
  );

  // Lookup by ID
  const findById = useCallback(
    (id: string): BudgetBucket | undefined => {
      return buckets.find((b) => b.id === id);
    },
    [buckets]
  );

  return {
    buckets,
    defaultBucket,
    findBySlug,
    findById,
  };
}
