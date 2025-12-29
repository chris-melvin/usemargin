import { describe, it, expect } from "vitest";

/**
 * Budget Bucket Repository Tests
 *
 * Tests for budget bucket operations including:
 * - Bucket matching logic for auto-categorization
 * - Default bucket selection
 * - Percentage calculations
 */

// Pure function implementations for testing bucket matching logic

interface BucketRule {
  id: string;
  bucket_id: string;
  match_type: "label" | "keyword" | "category";
  match_value: string;
  priority: number;
}

interface Expense {
  label: string;
  category?: string | null;
}

/**
 * Find the matching bucket for an expense based on rules
 * Rules are evaluated in priority order (higher priority first)
 */
function findMatchingBucket(
  expense: Expense,
  rules: BucketRule[]
): string | null {
  // Sort by priority descending
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const matchValue = rule.match_value.toLowerCase();

    switch (rule.match_type) {
      case "label":
        if (expense.label.toLowerCase() === matchValue) {
          return rule.bucket_id;
        }
        break;
      case "keyword":
        if (expense.label.toLowerCase().includes(matchValue)) {
          return rule.bucket_id;
        }
        break;
      case "category":
        if (expense.category?.toLowerCase() === matchValue) {
          return rule.bucket_id;
        }
        break;
    }
  }

  return null; // No match, will use default bucket
}

/**
 * Validate that bucket percentages sum to 100
 */
function validateBucketPercentages(percentages: number[]): {
  isValid: boolean;
  total: number;
} {
  const total = percentages.reduce((sum, p) => sum + p, 0);
  return {
    isValid: Math.abs(total - 100) < 0.01,
    total,
  };
}

/**
 * Find the default bucket from a list
 */
function findDefaultBucket<T extends { is_default: boolean }>(
  buckets: T[]
): T | null {
  return buckets.find((b) => b.is_default) ?? null;
}

describe("Budget Bucket Repository Logic", () => {
  describe("findMatchingBucket", () => {
    describe("label matching", () => {
      it("should match exact label (case insensitive)", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "label",
            match_value: "groceries",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Groceries" }, rules)
        ).toBe("bucket-food");
        expect(
          findMatchingBucket({ label: "GROCERIES" }, rules)
        ).toBe("bucket-food");
        expect(
          findMatchingBucket({ label: "groceries" }, rules)
        ).toBe("bucket-food");
      });

      it("should not match partial labels", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "label",
            match_value: "groceries",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Weekly Groceries" }, rules)
        ).toBeNull();
      });
    });

    describe("keyword matching", () => {
      it("should match keyword anywhere in label", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-transport",
            match_type: "keyword",
            match_value: "uber",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Uber ride to airport" }, rules)
        ).toBe("bucket-transport");
        expect(
          findMatchingBucket({ label: "uber" }, rules)
        ).toBe("bucket-transport");
        expect(
          findMatchingBucket({ label: "UBER Eats" }, rules)
        ).toBe("bucket-transport");
      });

      it("should not match if keyword is not present", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-transport",
            match_type: "keyword",
            match_value: "uber",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Taxi ride" }, rules)
        ).toBeNull();
      });
    });

    describe("category matching", () => {
      it("should match category (case insensitive)", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "category",
            match_value: "food & dining",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket(
            { label: "Starbucks", category: "Food & Dining" },
            rules
          )
        ).toBe("bucket-food");
      });

      it("should return null when category is null", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "category",
            match_value: "food & dining",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Starbucks", category: null }, rules)
        ).toBeNull();
      });

      it("should return null when category is undefined", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "category",
            match_value: "food & dining",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Starbucks" }, rules)
        ).toBeNull();
      });
    });

    describe("priority ordering", () => {
      it("should match higher priority rules first", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-general",
            match_type: "keyword",
            match_value: "coffee",
            priority: 1,
          },
          {
            id: "rule-2",
            bucket_id: "bucket-work",
            match_type: "keyword",
            match_value: "coffee",
            priority: 10, // Higher priority
          },
        ];

        expect(
          findMatchingBucket({ label: "Coffee meeting" }, rules)
        ).toBe("bucket-work");
      });

      it("should fall through to lower priority if higher doesn't match", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-general",
            match_type: "keyword",
            match_value: "coffee",
            priority: 1,
          },
          {
            id: "rule-2",
            bucket_id: "bucket-work",
            match_type: "label",
            match_value: "work lunch",
            priority: 10,
          },
        ];

        expect(
          findMatchingBucket({ label: "Coffee break" }, rules)
        ).toBe("bucket-general");
      });
    });

    describe("no match scenarios", () => {
      it("should return null when no rules exist", () => {
        expect(findMatchingBucket({ label: "Random expense" }, [])).toBeNull();
      });

      it("should return null when no rules match", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "label",
            match_value: "groceries",
            priority: 1,
          },
          {
            id: "rule-2",
            bucket_id: "bucket-transport",
            match_type: "keyword",
            match_value: "uber",
            priority: 1,
          },
        ];

        expect(
          findMatchingBucket({ label: "Netflix subscription" }, rules)
        ).toBeNull();
      });
    });

    describe("multiple matching rules", () => {
      it("should stop at first match (by priority)", () => {
        const rules: BucketRule[] = [
          {
            id: "rule-1",
            bucket_id: "bucket-food",
            match_type: "keyword",
            match_value: "food",
            priority: 5,
          },
          {
            id: "rule-2",
            bucket_id: "bucket-delivery",
            match_type: "keyword",
            match_value: "grab",
            priority: 10,
          },
          {
            id: "rule-3",
            bucket_id: "bucket-all",
            match_type: "keyword",
            match_value: "grab",
            priority: 1,
          },
        ];

        // "Grab Food" contains both "grab" and "food"
        // Should match bucket-delivery (priority 10 "grab" rule)
        expect(
          findMatchingBucket({ label: "Grab Food" }, rules)
        ).toBe("bucket-delivery");
      });
    });
  });

  describe("validateBucketPercentages", () => {
    it("should return valid for exactly 100%", () => {
      const result = validateBucketPercentages([50, 30, 20]);
      expect(result.isValid).toBe(true);
      expect(result.total).toBe(100);
    });

    it("should handle floating point precision", () => {
      const result = validateBucketPercentages([33.33, 33.33, 33.34]);
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for under 100%", () => {
      const result = validateBucketPercentages([30, 40]);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(70);
    });

    it("should return invalid for over 100%", () => {
      const result = validateBucketPercentages([60, 60]);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(120);
    });

    it("should handle single bucket", () => {
      const result = validateBucketPercentages([100]);
      expect(result.isValid).toBe(true);
    });

    it("should handle empty array", () => {
      const result = validateBucketPercentages([]);
      expect(result.isValid).toBe(false);
      expect(result.total).toBe(0);
    });
  });

  describe("findDefaultBucket", () => {
    it("should return the default bucket", () => {
      const buckets = [
        { id: "bucket-1", name: "Savings", is_default: false },
        { id: "bucket-2", name: "Daily", is_default: true },
        { id: "bucket-3", name: "Entertainment", is_default: false },
      ];

      const result = findDefaultBucket(buckets);
      expect(result?.id).toBe("bucket-2");
      expect(result?.name).toBe("Daily");
    });

    it("should return null when no default exists", () => {
      const buckets = [
        { id: "bucket-1", name: "Savings", is_default: false },
        { id: "bucket-2", name: "Entertainment", is_default: false },
      ];

      expect(findDefaultBucket(buckets)).toBeNull();
    });

    it("should return first default if multiple exist", () => {
      const buckets = [
        { id: "bucket-1", name: "First", is_default: true },
        { id: "bucket-2", name: "Second", is_default: true },
      ];

      expect(findDefaultBucket(buckets)?.id).toBe("bucket-1");
    });

    it("should return null for empty array", () => {
      expect(findDefaultBucket([])).toBeNull();
    });
  });
});

describe("Bucket Allocation Calculations", () => {
  /**
   * Calculate allocated amount for a bucket
   */
  function calculateAllocatedAmount(
    availableAmount: number,
    percentage: number
  ): number {
    return Math.floor((availableAmount * percentage) / 100);
  }

  describe("calculateAllocatedAmount", () => {
    it("should calculate correct allocation", () => {
      expect(calculateAllocatedAmount(10000, 20)).toBe(2000);
      expect(calculateAllocatedAmount(10000, 80)).toBe(8000);
    });

    it("should floor to prevent fractional amounts", () => {
      expect(calculateAllocatedAmount(9999, 33)).toBe(3299);
    });

    it("should handle zero available amount", () => {
      expect(calculateAllocatedAmount(0, 50)).toBe(0);
    });

    it("should handle zero percentage", () => {
      expect(calculateAllocatedAmount(10000, 0)).toBe(0);
    });

    it("should handle 100% allocation", () => {
      expect(calculateAllocatedAmount(5000, 100)).toBe(5000);
    });
  });
});

describe("Bucket Sort Order", () => {
  /**
   * Sort buckets by sort_order
   */
  function sortBuckets<T extends { sort_order: number }>(buckets: T[]): T[] {
    return [...buckets].sort((a, b) => a.sort_order - b.sort_order);
  }

  it("should sort buckets by sort_order ascending", () => {
    const buckets = [
      { id: "3", sort_order: 2 },
      { id: "1", sort_order: 0 },
      { id: "2", sort_order: 1 },
    ];

    const sorted = sortBuckets(buckets);
    expect(sorted.map((b) => b.id)).toEqual(["1", "2", "3"]);
  });

  it("should handle equal sort orders (stable sort)", () => {
    const buckets = [
      { id: "a", sort_order: 0 },
      { id: "b", sort_order: 0 },
      { id: "c", sort_order: 1 },
    ];

    const sorted = sortBuckets(buckets);
    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
    expect(sorted[2].id).toBe("c");
  });

  it("should handle empty array", () => {
    expect(sortBuckets([])).toEqual([]);
  });
});
