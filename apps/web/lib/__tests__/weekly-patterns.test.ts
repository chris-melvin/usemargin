import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Extract pure calculation logic for testing
// This mirrors the logic in use-weekly-patterns.ts

interface Expense {
  id: string;
  date: string;
  amount: number;
  label: string;
}

interface CategoryData {
  category: string;
  amount: number;
  previousAmount: number;
  icon?: string;
}

const CATEGORY_MAP: Record<string, { category: string; icon: string }> = {
  coffee: { category: "Coffee & Drinks", icon: "☕" },
  lunch: { category: "Food", icon: "🍱" },
  dinner: { category: "Food", icon: "🍱" },
  breakfast: { category: "Food", icon: "🍱" },
  grab: { category: "Food Delivery", icon: "🛵" },
  grabfood: { category: "Food Delivery", icon: "🛵" },
  foodpanda: { category: "Food Delivery", icon: "🛵" },
  commute: { category: "Transportation", icon: "🚌" },
  taxi: { category: "Transportation", icon: "🚕" },
  snack: { category: "Snacks", icon: "🍿" },
  groceries: { category: "Groceries", icon: "🛒" },
  shopping: { category: "Shopping", icon: "🛍️" },
  entertainment: { category: "Entertainment", icon: "🎬" },
  utilities: { category: "Utilities", icon: "💡" },
};

/**
 * Categorize an expense by its label
 */
function categorizeExpense(label: string): { category: string; icon: string } {
  const normalized = label.toLowerCase().trim();

  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  return { category: "Other", icon: "📦" };
}

/**
 * Get start of week (Sunday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Saturday)
 */
function getWeekEnd(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  d.setDate(diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Calculate weekly totals and patterns
 */
function calculateWeeklyPatterns(expenses: Expense[], referenceDate: Date = new Date()) {
  const thisWeekStart = getWeekStart(referenceDate);
  const thisWeekEnd = getWeekEnd(referenceDate);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const thisWeekExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return date >= thisWeekStart && date <= thisWeekEnd;
  });

  const lastWeekExpenses = expenses.filter((e) => {
    const date = new Date(e.date);
    return date >= lastWeekStart && date <= lastWeekEnd;
  });

  const weeklyTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
  const previousWeekTotal = lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown
  const categoryTotals = new Map<string, { amount: number; icon: string }>();
  const previousCategoryTotals = new Map<string, number>();

  for (const expense of thisWeekExpenses) {
    const { category, icon } = categorizeExpense(expense.label);
    const existing = categoryTotals.get(category);
    categoryTotals.set(category, {
      amount: (existing?.amount || 0) + expense.amount,
      icon,
    });
  }

  for (const expense of lastWeekExpenses) {
    const { category } = categorizeExpense(expense.label);
    const existing = previousCategoryTotals.get(category) || 0;
    previousCategoryTotals.set(category, existing + expense.amount);
  }

  const categoryBreakdown: CategoryData[] = [];
  for (const [category, data] of categoryTotals) {
    categoryBreakdown.push({
      category,
      amount: data.amount,
      previousAmount: previousCategoryTotals.get(category) || 0,
      icon: data.icon,
    });
  }

  return {
    weeklyTotal,
    previousWeekTotal,
    categoryBreakdown: categoryBreakdown.sort((a, b) => b.amount - a.amount),
    thisWeekExpenses,
    lastWeekExpenses,
  };
}

/**
 * Find highest spending day
 */
function findHighestSpendingDay(expenses: Expense[]): { day: string; amount: number } {
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayTotals = new Map<number, number>();

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const dayOfWeek = date.getDay();
    const existing = dayTotals.get(dayOfWeek) || 0;
    dayTotals.set(dayOfWeek, existing + expense.amount);
  }

  let highestDay = { day: "None", amount: 0 };
  for (const [dayIndex, amount] of dayTotals) {
    if (amount > highestDay.amount) {
      highestDay = { day: DAY_NAMES[dayIndex] || "Unknown", amount };
    }
  }

  return highestDay;
}

/**
 * Generate spending suggestion
 */
function generateSuggestion(
  categoryBreakdown: CategoryData[],
  weeklyTotal: number,
  previousWeekTotal: number
): string {
  if (categoryBreakdown.length === 0) {
    return "Keep tracking your expenses to get personalized insights!";
  }

  const topCategory = categoryBreakdown[0];

  if (topCategory && topCategory.category === "Food Delivery") {
    const percent = Math.round((topCategory.amount / weeklyTotal) * 100);
    return `Food delivery is your top expense at ${percent}%. Consider cooking at home 2x this week to save money.`;
  }

  if (topCategory && topCategory.category === "Coffee & Drinks") {
    return `Your coffee habit adds up! Try brewing at home some days to save around ₱500/week.`;
  }

  if (topCategory && topCategory.category === "Transportation") {
    return `Transportation is significant. Consider carpooling or combining trips to reduce costs.`;
  }

  if (weeklyTotal > previousWeekTotal * 1.2) {
    return `You're spending 20%+ more than last week. Review your expenses and adjust as needed.`;
  }

  if (weeklyTotal < previousWeekTotal * 0.8) {
    return `Great job! You're spending 20%+ less than last week. Keep up the good habits!`;
  }

  return "Keep tracking your expenses to get personalized insights!";
}

describe("Weekly Patterns", () => {
  describe("categorizeExpense", () => {
    it("should categorize coffee-related labels", () => {
      expect(categorizeExpense("Coffee")).toEqual({ category: "Coffee & Drinks", icon: "☕" });
      expect(categorizeExpense("morning coffee")).toEqual({ category: "Coffee & Drinks", icon: "☕" });
      expect(categorizeExpense("Starbucks Coffee")).toEqual({ category: "Coffee & Drinks", icon: "☕" });
    });

    it("should categorize food-related labels", () => {
      expect(categorizeExpense("Lunch")).toEqual({ category: "Food", icon: "🍱" });
      expect(categorizeExpense("Dinner at restaurant")).toEqual({ category: "Food", icon: "🍱" });
      expect(categorizeExpense("breakfast")).toEqual({ category: "Food", icon: "🍱" });
    });

    it("should categorize delivery services", () => {
      expect(categorizeExpense("GrabFood")).toEqual({ category: "Food Delivery", icon: "🛵" });
      expect(categorizeExpense("grab order")).toEqual({ category: "Food Delivery", icon: "🛵" });
      expect(categorizeExpense("foodpanda")).toEqual({ category: "Food Delivery", icon: "🛵" });
    });

    it("should categorize transportation", () => {
      expect(categorizeExpense("Commute")).toEqual({ category: "Transportation", icon: "🚌" });
      expect(categorizeExpense("taxi ride")).toEqual({ category: "Transportation", icon: "🚕" });
    });

    it("should return Other for unknown labels", () => {
      expect(categorizeExpense("random expense")).toEqual({ category: "Other", icon: "📦" });
      expect(categorizeExpense("xyz")).toEqual({ category: "Other", icon: "📦" });
    });

    it("should be case-insensitive", () => {
      expect(categorizeExpense("COFFEE")).toEqual({ category: "Coffee & Drinks", icon: "☕" });
      expect(categorizeExpense("LuNcH")).toEqual({ category: "Food", icon: "🍱" });
    });

    it("should handle labels with extra whitespace", () => {
      expect(categorizeExpense("  coffee  ")).toEqual({ category: "Coffee & Drinks", icon: "☕" });
    });
  });

  describe("getWeekStart", () => {
    it("should return Sunday for any day in the week", () => {
      // Wednesday, June 12, 2024
      const wednesday = new Date("2024-06-12");
      const weekStart = getWeekStart(wednesday);
      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekStart.getDate()).toBe(9);
    });

    it("should return same day if already Sunday", () => {
      const sunday = new Date("2024-06-09");
      const weekStart = getWeekStart(sunday);
      expect(weekStart.getDay()).toBe(0);
      expect(weekStart.getDate()).toBe(9);
    });

    it("should return previous Sunday for Saturday", () => {
      const saturday = new Date("2024-06-15");
      const weekStart = getWeekStart(saturday);
      expect(weekStart.getDay()).toBe(0);
      expect(weekStart.getDate()).toBe(9);
    });

    it("should set time to midnight", () => {
      const date = new Date("2024-06-12T15:30:00");
      const weekStart = getWeekStart(date);
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
    });
  });

  describe("getWeekEnd", () => {
    it("should return Saturday for any day in the week", () => {
      const wednesday = new Date("2024-06-12");
      const weekEnd = getWeekEnd(wednesday);
      expect(weekEnd.getDay()).toBe(6); // Saturday
      expect(weekEnd.getDate()).toBe(15);
    });

    it("should return same day if already Saturday", () => {
      const saturday = new Date("2024-06-15");
      const weekEnd = getWeekEnd(saturday);
      expect(weekEnd.getDay()).toBe(6);
      expect(weekEnd.getDate()).toBe(15);
    });

    it("should set time to end of day", () => {
      const date = new Date("2024-06-12T10:00:00");
      const weekEnd = getWeekEnd(date);
      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
    });
  });

  describe("calculateWeeklyPatterns", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-12T12:00:00Z")); // Wednesday
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate weekly total correctly", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "Coffee" },
        { id: "2", date: "2024-06-11", amount: 150, label: "Lunch" },
        { id: "3", date: "2024-06-12", amount: 200, label: "Dinner" },
      ];

      const result = calculateWeeklyPatterns(expenses, new Date("2024-06-12"));
      expect(result.weeklyTotal).toBe(450);
    });

    it("should exclude expenses from previous week", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "This week" },
        { id: "2", date: "2024-06-03", amount: 500, label: "Last week" }, // Previous week
      ];

      const result = calculateWeeklyPatterns(expenses, new Date("2024-06-12"));
      expect(result.weeklyTotal).toBe(100);
      expect(result.previousWeekTotal).toBe(500);
    });

    it("should group expenses by category", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "Coffee" },
        { id: "2", date: "2024-06-11", amount: 120, label: "Coffee" },
        { id: "3", date: "2024-06-12", amount: 180, label: "Lunch" },
      ];

      const result = calculateWeeklyPatterns(expenses, new Date("2024-06-12"));
      const coffeeCategory = result.categoryBreakdown.find((c) => c.category === "Coffee & Drinks");
      const foodCategory = result.categoryBreakdown.find((c) => c.category === "Food");

      expect(coffeeCategory?.amount).toBe(220);
      expect(foodCategory?.amount).toBe(180);
    });

    it("should sort categories by amount descending", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "Coffee" },
        { id: "2", date: "2024-06-11", amount: 500, label: "Lunch" },
        { id: "3", date: "2024-06-12", amount: 200, label: "Grab" },
      ];

      const result = calculateWeeklyPatterns(expenses, new Date("2024-06-12"));
      expect(result.categoryBreakdown[0]?.category).toBe("Food");
      expect(result.categoryBreakdown[0]?.amount).toBe(500);
    });

    it("should return zero totals for empty expenses", () => {
      const result = calculateWeeklyPatterns([], new Date("2024-06-12"));
      expect(result.weeklyTotal).toBe(0);
      expect(result.previousWeekTotal).toBe(0);
      expect(result.categoryBreakdown).toHaveLength(0);
    });
  });

  describe("findHighestSpendingDay", () => {
    it("should find the day with highest spending", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "Monday expense" }, // Monday
        { id: "2", date: "2024-06-11", amount: 500, label: "Tuesday expense" }, // Tuesday (highest)
        { id: "3", date: "2024-06-12", amount: 200, label: "Wednesday expense" }, // Wednesday
      ];

      const result = findHighestSpendingDay(expenses);
      expect(result.day).toBe("Tuesday");
      expect(result.amount).toBe(500);
    });

    it("should aggregate multiple expenses on same day", () => {
      const expenses: Expense[] = [
        { id: "1", date: "2024-06-10", amount: 100, label: "Morning" },
        { id: "2", date: "2024-06-10", amount: 200, label: "Afternoon" },
        { id: "3", date: "2024-06-10", amount: 150, label: "Evening" },
        { id: "4", date: "2024-06-11", amount: 400, label: "Tuesday" },
      ];

      const result = findHighestSpendingDay(expenses);
      expect(result.day).toBe("Monday");
      expect(result.amount).toBe(450);
    });

    it("should return 'None' for empty expenses", () => {
      const result = findHighestSpendingDay([]);
      expect(result.day).toBe("None");
      expect(result.amount).toBe(0);
    });
  });

  describe("generateSuggestion", () => {
    it("should suggest reducing food delivery if top category", () => {
      const breakdown: CategoryData[] = [
        { category: "Food Delivery", amount: 600, previousAmount: 500 },
        { category: "Coffee & Drinks", amount: 200, previousAmount: 180 },
      ];

      const suggestion = generateSuggestion(breakdown, 800, 680);
      expect(suggestion).toContain("Food delivery");
      expect(suggestion).toContain("cooking at home");
    });

    it("should suggest reducing coffee if top category", () => {
      const breakdown: CategoryData[] = [
        { category: "Coffee & Drinks", amount: 500, previousAmount: 400 },
        { category: "Food", amount: 300, previousAmount: 250 },
      ];

      const suggestion = generateSuggestion(breakdown, 800, 650);
      expect(suggestion).toContain("coffee habit");
      expect(suggestion).toContain("brewing at home");
    });

    it("should warn about spending 20%+ more than last week", () => {
      const breakdown: CategoryData[] = [
        { category: "Other", amount: 500, previousAmount: 300 },
      ];

      const suggestion = generateSuggestion(breakdown, 1200, 800);
      expect(suggestion).toContain("20%+ more");
    });

    it("should congratulate spending 20%+ less than last week", () => {
      const breakdown: CategoryData[] = [
        { category: "Other", amount: 300, previousAmount: 500 },
      ];

      const suggestion = generateSuggestion(breakdown, 600, 1000);
      expect(suggestion).toContain("Great job");
      expect(suggestion).toContain("20%+ less");
    });

    it("should return default message for empty breakdown", () => {
      const suggestion = generateSuggestion([], 0, 0);
      expect(suggestion).toContain("Keep tracking");
    });
  });
});
