import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatKey } from "../utils";
import { DEFAULT_DAILY_LIMIT } from "../constants";

// Extract pure calculation logic for testing
// This mirrors the logic in useCalendar hook

interface Expense {
  id: string;
  date: string;
  amount: number;
  label: string;
}

/**
 * Calculate today's budget status based on expenses
 */
function calculateTodayStatus(expenses: Expense[], dailyLimit: number = DEFAULT_DAILY_LIMIT) {
  const today = new Date();
  const todayKey = formatKey(today);

  const todayExpenses = expenses.filter((e) => formatKey(new Date(e.date)) === todayKey);
  const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = dailyLimit - spent;

  return {
    spent,
    remaining,
    limit: dailyLimit,
    isOver: remaining < 0,
  };
}

/**
 * Calculate spending percentage
 */
function calculateSpendingPercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((spent / limit) * 100, 100);
}

/**
 * Determine budget status color
 */
function getBudgetStatusColor(remaining: number, spent: number, limit: number): "green" | "amber" | "red" {
  if (remaining < 0) return "red";
  const percent = (spent / limit) * 100;
  if (percent >= 80) return "amber";
  return "green";
}

describe("Budget Calculations", () => {
  describe("calculateTodayStatus", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return zero spent when no expenses", () => {
      const result = calculateTodayStatus([]);
      expect(result.spent).toBe(0);
      expect(result.remaining).toBe(DEFAULT_DAILY_LIMIT);
      expect(result.isOver).toBe(false);
    });

    it("should sum expenses for today only", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-15", amount: 100, label: "Coffee" },
        { id: "2", date: "2024-06-15", amount: 50, label: "Snack" },
        { id: "3", date: "2024-06-14", amount: 200, label: "Yesterday" }, // Should be excluded
      ];

      const result = calculateTodayStatus(expenses);
      expect(result.spent).toBe(150);
      expect(result.remaining).toBe(DEFAULT_DAILY_LIMIT - 150);
    });

    it("should detect over-budget status", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-15", amount: 200, label: "Lunch" },
        { id: "2", date: "2024-06-15", amount: 150, label: "Dinner" },
      ];

      const result = calculateTodayStatus(expenses);
      expect(result.spent).toBe(350);
      expect(result.remaining).toBe(DEFAULT_DAILY_LIMIT - 350);
      expect(result.isOver).toBe(true);
    });

    it("should handle exactly at limit", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-15", amount: DEFAULT_DAILY_LIMIT, label: "Exactly limit" },
      ];

      const result = calculateTodayStatus(expenses);
      expect(result.spent).toBe(DEFAULT_DAILY_LIMIT);
      expect(result.remaining).toBe(0);
      expect(result.isOver).toBe(false);
    });

    it("should use custom daily limit", () => {
      const customLimit = 500;
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-15", amount: 200, label: "Expense" },
      ];

      const result = calculateTodayStatus(expenses, customLimit);
      expect(result.limit).toBe(customLimit);
      expect(result.remaining).toBe(300);
    });

    it("should handle multiple expenses correctly", () => {
      const expenses: Expense[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        date: "2024-06-15",
        amount: 20,
        label: `Expense ${i}`,
      }));

      const result = calculateTodayStatus(expenses);
      expect(result.spent).toBe(200);
    });

    it("should handle expenses with decimal amounts", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-15", amount: 99.5, label: "Coffee" },
        { id: "2", date: "2024-06-15", amount: 150.75, label: "Lunch" },
      ];

      const result = calculateTodayStatus(expenses);
      expect(result.spent).toBe(250.25);
    });
  });

  describe("calculateSpendingPercentage", () => {
    it("should return 0 when nothing spent", () => {
      expect(calculateSpendingPercentage(0, 300)).toBe(0);
    });

    it("should return 50% when half spent", () => {
      expect(calculateSpendingPercentage(150, 300)).toBe(50);
    });

    it("should cap at 100% when over limit", () => {
      expect(calculateSpendingPercentage(400, 300)).toBe(100);
    });

    it("should return 0 when limit is 0 or negative", () => {
      expect(calculateSpendingPercentage(100, 0)).toBe(0);
      expect(calculateSpendingPercentage(100, -50)).toBe(0);
    });

    it("should handle edge case at exactly 100%", () => {
      expect(calculateSpendingPercentage(300, 300)).toBe(100);
    });

    it("should return precise percentage", () => {
      expect(calculateSpendingPercentage(75, 300)).toBe(25);
      expect(calculateSpendingPercentage(240, 300)).toBe(80);
    });
  });

  describe("getBudgetStatusColor", () => {
    const limit = 300;

    it("should return green when under 80% spent", () => {
      expect(getBudgetStatusColor(100, 200, limit)).toBe("green");
      expect(getBudgetStatusColor(150, 150, limit)).toBe("green");
    });

    it("should return amber when 80% or more spent", () => {
      expect(getBudgetStatusColor(60, 240, limit)).toBe("amber"); // 80%
      expect(getBudgetStatusColor(30, 270, limit)).toBe("amber"); // 90%
    });

    it("should return red when over budget", () => {
      expect(getBudgetStatusColor(-50, 350, limit)).toBe("red");
      expect(getBudgetStatusColor(-1, 301, limit)).toBe("red");
    });

    it("should return amber at exactly 80%", () => {
      expect(getBudgetStatusColor(60, 240, limit)).toBe("amber");
    });

    it("should return green at 79%", () => {
      expect(getBudgetStatusColor(63, 237, limit)).toBe("green");
    });
  });

  describe("Daily Limit Constant", () => {
    it("should have correct default daily limit", () => {
      expect(DEFAULT_DAILY_LIMIT).toBe(300);
    });

    it("should be a positive number", () => {
      expect(DEFAULT_DAILY_LIMIT).toBeGreaterThan(0);
    });
  });
});
