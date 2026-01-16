import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Analytics Calculation Tests
 *
 * Tests for analytics calculations including:
 * - Net worth calculations
 * - Cash flow calculations
 * - Bills status calculations
 * - Savings progress calculations
 */

// ============================================================================
// Net Worth Calculations
// ============================================================================

interface Asset {
  id: string;
  name: string;
  balance: number;
}

interface Liability {
  id: string;
  name: string;
  balance: number;
}

function calculateNetWorth(assets: Asset[], liabilities: Liability[]): number {
  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
  return totalAssets - totalLiabilities;
}

function calculateTotalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.balance, 0);
}

function calculateTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.balance, 0);
}

describe("Net Worth Calculations", () => {
  describe("calculateNetWorth", () => {
    it("should calculate net worth as assets minus liabilities", () => {
      const assets: Asset[] = [
        { id: "1", name: "Savings", balance: 10000 },
        { id: "2", name: "Investment", balance: 25000 },
      ];
      const liabilities: Liability[] = [
        { id: "1", name: "Credit Card", balance: 2000 },
        { id: "2", name: "Car Loan", balance: 8000 },
      ];

      expect(calculateNetWorth(assets, liabilities)).toBe(25000);
    });

    it("should handle zero assets", () => {
      const liabilities: Liability[] = [
        { id: "1", name: "Debt", balance: 5000 },
      ];

      expect(calculateNetWorth([], liabilities)).toBe(-5000);
    });

    it("should handle zero liabilities", () => {
      const assets: Asset[] = [{ id: "1", name: "Savings", balance: 10000 }];

      expect(calculateNetWorth(assets, [])).toBe(10000);
    });

    it("should handle negative net worth", () => {
      const assets: Asset[] = [{ id: "1", name: "Savings", balance: 5000 }];
      const liabilities: Liability[] = [
        { id: "1", name: "Loan", balance: 20000 },
      ];

      expect(calculateNetWorth(assets, liabilities)).toBe(-15000);
    });

    it("should handle empty arrays", () => {
      expect(calculateNetWorth([], [])).toBe(0);
    });

    it("should handle decimal amounts", () => {
      const assets: Asset[] = [
        { id: "1", name: "Savings", balance: 1000.50 },
      ];
      const liabilities: Liability[] = [
        { id: "1", name: "Debt", balance: 500.25 },
      ];

      expect(calculateNetWorth(assets, liabilities)).toBeCloseTo(500.25);
    });
  });

  describe("calculateTotalAssets", () => {
    it("should sum all asset balances", () => {
      const assets: Asset[] = [
        { id: "1", name: "A", balance: 1000 },
        { id: "2", name: "B", balance: 2000 },
        { id: "3", name: "C", balance: 3000 },
      ];

      expect(calculateTotalAssets(assets)).toBe(6000);
    });

    it("should return 0 for empty assets", () => {
      expect(calculateTotalAssets([])).toBe(0);
    });
  });

  describe("calculateTotalLiabilities", () => {
    it("should sum all liability balances", () => {
      const liabilities: Liability[] = [
        { id: "1", name: "A", balance: 500 },
        { id: "2", name: "B", balance: 1500 },
      ];

      expect(calculateTotalLiabilities(liabilities)).toBe(2000);
    });

    it("should return 0 for empty liabilities", () => {
      expect(calculateTotalLiabilities([])).toBe(0);
    });
  });
});

// ============================================================================
// Savings Progress Calculations
// ============================================================================

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
}

function calculateGoalProgress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentBalance / goal.targetAmount) * 100);
}

function calculateOverallProgress(goals: SavingsGoal[]): number {
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentBalance, 0);

  if (totalTarget <= 0) return 0;
  return Math.min(100, (totalSaved / totalTarget) * 100);
}

describe("Savings Progress Calculations", () => {
  describe("calculateGoalProgress", () => {
    it("should calculate percentage progress", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Vacation",
        targetAmount: 10000,
        currentBalance: 5000,
      };

      expect(calculateGoalProgress(goal)).toBe(50);
    });

    it("should cap at 100% when exceeded", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Vacation",
        targetAmount: 1000,
        currentBalance: 1500,
      };

      expect(calculateGoalProgress(goal)).toBe(100);
    });

    it("should return 0 for zero target", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Test",
        targetAmount: 0,
        currentBalance: 100,
      };

      expect(calculateGoalProgress(goal)).toBe(0);
    });

    it("should return 0 for negative target", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Test",
        targetAmount: -1000,
        currentBalance: 100,
      };

      expect(calculateGoalProgress(goal)).toBe(0);
    });

    it("should handle zero current balance", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Test",
        targetAmount: 1000,
        currentBalance: 0,
      };

      expect(calculateGoalProgress(goal)).toBe(0);
    });

    it("should handle decimal percentages", () => {
      const goal: SavingsGoal = {
        id: "1",
        name: "Test",
        targetAmount: 3000,
        currentBalance: 1000,
      };

      expect(calculateGoalProgress(goal)).toBeCloseTo(33.33, 1);
    });
  });

  describe("calculateOverallProgress", () => {
    it("should calculate combined progress across goals", () => {
      const goals: SavingsGoal[] = [
        { id: "1", name: "A", targetAmount: 1000, currentBalance: 500 },
        { id: "2", name: "B", targetAmount: 1000, currentBalance: 500 },
      ];

      expect(calculateOverallProgress(goals)).toBe(50);
    });

    it("should handle different completion levels", () => {
      const goals: SavingsGoal[] = [
        { id: "1", name: "A", targetAmount: 1000, currentBalance: 1000 }, // 100%
        { id: "2", name: "B", targetAmount: 1000, currentBalance: 0 }, // 0%
      ];

      expect(calculateOverallProgress(goals)).toBe(50);
    });

    it("should return 0 for empty goals", () => {
      expect(calculateOverallProgress([])).toBe(0);
    });

    it("should cap at 100%", () => {
      const goals: SavingsGoal[] = [
        { id: "1", name: "A", targetAmount: 1000, currentBalance: 2000 },
      ];

      expect(calculateOverallProgress(goals)).toBe(100);
    });
  });
});

// ============================================================================
// Bills Status Calculations
// ============================================================================

interface Bill {
  id: string;
  label: string;
  amount: number;
  dueDate: number; // day of month
  status: "pending" | "paid" | "overdue";
}

function identifyOverdueBills(bills: Bill[], today: Date): Bill[] {
  const currentDay = today.getDate();

  return bills.filter((bill) => {
    if (bill.status === "paid") return false;
    return bill.dueDate < currentDay;
  });
}

function identifyPendingBills(bills: Bill[], today: Date): Bill[] {
  const currentDay = today.getDate();

  return bills.filter((bill) => {
    if (bill.status === "paid") return false;
    return bill.dueDate >= currentDay;
  });
}

function calculateTotalPending(bills: Bill[], today: Date): number {
  return identifyPendingBills(bills, today).reduce(
    (sum, b) => sum + b.amount,
    0
  );
}

function calculateTotalOverdue(bills: Bill[], today: Date): number {
  return identifyOverdueBills(bills, today).reduce(
    (sum, b) => sum + b.amount,
    0
  );
}

describe("Bills Status Calculations", () => {
  describe("identifyOverdueBills", () => {
    it("should identify bills with due date before today", () => {
      const bills: Bill[] = [
        { id: "1", label: "Rent", amount: 1500, dueDate: 1, status: "pending" },
        { id: "2", label: "Electric", amount: 100, dueDate: 15, status: "pending" },
      ];

      const today = new Date("2024-06-10");
      const overdue = identifyOverdueBills(bills, today);

      expect(overdue).toHaveLength(1);
      expect(overdue[0]?.label).toBe("Rent");
    });

    it("should not include paid bills", () => {
      const bills: Bill[] = [
        { id: "1", label: "Rent", amount: 1500, dueDate: 1, status: "paid" },
      ];

      const today = new Date("2024-06-10");
      expect(identifyOverdueBills(bills, today)).toHaveLength(0);
    });

    it("should not include bills due today", () => {
      const bills: Bill[] = [
        { id: "1", label: "Bill", amount: 100, dueDate: 10, status: "pending" },
      ];

      const today = new Date("2024-06-10");
      expect(identifyOverdueBills(bills, today)).toHaveLength(0);
    });

    it("should handle empty bills", () => {
      expect(identifyOverdueBills([], new Date())).toHaveLength(0);
    });
  });

  describe("identifyPendingBills", () => {
    it("should identify bills due today or later", () => {
      const bills: Bill[] = [
        { id: "1", label: "Rent", amount: 1500, dueDate: 1, status: "pending" },
        { id: "2", label: "Electric", amount: 100, dueDate: 15, status: "pending" },
        { id: "3", label: "Internet", amount: 50, dueDate: 20, status: "pending" },
      ];

      const today = new Date("2024-06-10");
      const pending = identifyPendingBills(bills, today);

      expect(pending).toHaveLength(2);
      expect(pending.map((b) => b.label)).toContain("Electric");
      expect(pending.map((b) => b.label)).toContain("Internet");
    });

    it("should include bills due today", () => {
      const bills: Bill[] = [
        { id: "1", label: "Bill", amount: 100, dueDate: 10, status: "pending" },
      ];

      const today = new Date("2024-06-10");
      expect(identifyPendingBills(bills, today)).toHaveLength(1);
    });

    it("should not include paid bills", () => {
      const bills: Bill[] = [
        { id: "1", label: "Bill", amount: 100, dueDate: 20, status: "paid" },
      ];

      const today = new Date("2024-06-10");
      expect(identifyPendingBills(bills, today)).toHaveLength(0);
    });
  });

  describe("calculateTotalPending", () => {
    it("should sum pending bill amounts", () => {
      const bills: Bill[] = [
        { id: "1", label: "A", amount: 100, dueDate: 15, status: "pending" },
        { id: "2", label: "B", amount: 200, dueDate: 20, status: "pending" },
        { id: "3", label: "C", amount: 300, dueDate: 1, status: "pending" }, // Overdue
      ];

      const today = new Date("2024-06-10");
      expect(calculateTotalPending(bills, today)).toBe(300);
    });
  });

  describe("calculateTotalOverdue", () => {
    it("should sum overdue bill amounts", () => {
      const bills: Bill[] = [
        { id: "1", label: "A", amount: 100, dueDate: 1, status: "pending" },
        { id: "2", label: "B", amount: 200, dueDate: 5, status: "pending" },
        { id: "3", label: "C", amount: 300, dueDate: 15, status: "pending" }, // Not overdue
      ];

      const today = new Date("2024-06-10");
      expect(calculateTotalOverdue(bills, today)).toBe(300);
    });
  });
});

// ============================================================================
// Cash Flow Calculations
// ============================================================================

interface Income {
  label: string;
  amount: number;
}

interface CategoryTotal {
  category: string;
  total: number;
}

function calculateIncomeShare(income: Income, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  return income.amount / totalIncome;
}

function calculateAllocationValue(
  allocation: number,
  incomeShare: number
): number {
  return Math.round(allocation * incomeShare);
}

function calculateTotalExpensesByCategory(
  expenses: { category: string; amount: number }[]
): CategoryTotal[] {
  const totals: Record<string, number> = {};

  for (const expense of expenses) {
    const category = expense.category || "Other";
    totals[category] = (totals[category] || 0) + expense.amount;
  }

  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

describe("Cash Flow Calculations", () => {
  describe("calculateIncomeShare", () => {
    it("should calculate proportion of total income", () => {
      const income: Income = { label: "Salary", amount: 4000 };
      expect(calculateIncomeShare(income, 5000)).toBe(0.8);
    });

    it("should return 0 for zero total income", () => {
      const income: Income = { label: "Salary", amount: 1000 };
      expect(calculateIncomeShare(income, 0)).toBe(0);
    });

    it("should return 1 for single income source", () => {
      const income: Income = { label: "Salary", amount: 5000 };
      expect(calculateIncomeShare(income, 5000)).toBe(1);
    });
  });

  describe("calculateAllocationValue", () => {
    it("should calculate proportional allocation", () => {
      expect(calculateAllocationValue(1000, 0.5)).toBe(500);
    });

    it("should round to nearest integer", () => {
      expect(calculateAllocationValue(1000, 0.333)).toBe(333);
    });

    it("should handle zero share", () => {
      expect(calculateAllocationValue(1000, 0)).toBe(0);
    });

    it("should handle full share", () => {
      expect(calculateAllocationValue(1000, 1)).toBe(1000);
    });
  });

  describe("calculateTotalExpensesByCategory", () => {
    it("should aggregate expenses by category", () => {
      const expenses = [
        { category: "Food", amount: 100 },
        { category: "Food", amount: 50 },
        { category: "Transport", amount: 30 },
      ];

      const result = calculateTotalExpensesByCategory(expenses);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ category: "Food", total: 150 });
      expect(result[1]).toEqual({ category: "Transport", total: 30 });
    });

    it("should sort by total descending", () => {
      const expenses = [
        { category: "A", amount: 10 },
        { category: "B", amount: 100 },
        { category: "C", amount: 50 },
      ];

      const result = calculateTotalExpensesByCategory(expenses);

      expect(result[0]?.category).toBe("B");
      expect(result[1]?.category).toBe("C");
      expect(result[2]?.category).toBe("A");
    });

    it("should handle empty category as 'Other'", () => {
      const expenses = [
        { category: "", amount: 100 },
        { category: "Food", amount: 50 },
      ];

      const result = calculateTotalExpensesByCategory(expenses);
      expect(result.find((r) => r.category === "Other")?.total).toBe(100);
    });

    it("should handle empty expenses", () => {
      expect(calculateTotalExpensesByCategory([])).toHaveLength(0);
    });
  });
});

// ============================================================================
// Spending Percentage Calculations
// ============================================================================

function calculateSpendingPercentage(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((spent / limit) * 100, 100);
}

function getBudgetStatusColor(
  remaining: number,
  spent: number,
  limit: number
): "red" | "amber" | "green" {
  if (remaining < 0) return "red";
  if ((spent / limit) * 100 >= 80) return "amber";
  return "green";
}

describe("Spending Percentage Calculations", () => {
  describe("calculateSpendingPercentage", () => {
    it("should calculate percentage of limit spent", () => {
      expect(calculateSpendingPercentage(50, 100)).toBe(50);
    });

    it("should cap at 100%", () => {
      expect(calculateSpendingPercentage(150, 100)).toBe(100);
    });

    it("should return 0 for zero limit", () => {
      expect(calculateSpendingPercentage(50, 0)).toBe(0);
    });

    it("should return 0 for negative limit", () => {
      expect(calculateSpendingPercentage(50, -100)).toBe(0);
    });

    it("should handle zero spent", () => {
      expect(calculateSpendingPercentage(0, 100)).toBe(0);
    });

    it("should handle exact limit", () => {
      expect(calculateSpendingPercentage(100, 100)).toBe(100);
    });
  });

  describe("getBudgetStatusColor", () => {
    it("should return red when over budget", () => {
      expect(getBudgetStatusColor(-10, 110, 100)).toBe("red");
    });

    it("should return amber at 80% spent", () => {
      expect(getBudgetStatusColor(20, 80, 100)).toBe("amber");
    });

    it("should return amber above 80%", () => {
      expect(getBudgetStatusColor(5, 95, 100)).toBe("amber");
    });

    it("should return green below 80%", () => {
      expect(getBudgetStatusColor(30, 70, 100)).toBe("green");
    });

    it("should return green at exactly 79%", () => {
      expect(getBudgetStatusColor(21, 79, 100)).toBe("green");
    });
  });
});
