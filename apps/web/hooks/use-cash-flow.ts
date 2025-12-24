"use client";

import { useMemo } from "react";
import type {
  LocalExpense,
  LocalIncome,
  LocalBill,
  CashFlowData,
  CashFlowNode,
  CashFlowLink,
  DateRange,
} from "@/lib/types";
import { filterByDateRange } from "./use-timeframe";
import { DEFAULT_DAILY_LIMIT } from "@/lib/constants";

// Category mapping for expenses
const CATEGORY_MAP: Record<string, string> = {
  coffee: "Coffee & Drinks",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  grab: "Food Delivery",
  grabfood: "Food Delivery",
  foodpanda: "Food Delivery",
  commute: "Transportation",
  taxi: "Transportation",
  snack: "Snacks",
  groceries: "Groceries",
  shopping: "Shopping",
  entertainment: "Entertainment",
};

// Get category from expense label
function getCategoryFromLabel(label: string): string {
  const lowerLabel = label.toLowerCase();
  for (const [trigger, category] of Object.entries(CATEGORY_MAP)) {
    if (lowerLabel.includes(trigger)) {
      return category;
    }
  }
  return "Other";
}

interface UseCashFlowProps {
  expenses: LocalExpense[];
  incomes: LocalIncome[];
  bills: LocalBill[];
  dateRange: DateRange;
  savingsAllocation?: number;
  flexBucketAllocation?: number;
}

export function useCashFlow({
  expenses,
  incomes,
  bills,
  dateRange,
  savingsAllocation = 0,
  flexBucketAllocation = 0,
}: UseCashFlowProps): CashFlowData {
  return useMemo(() => {
    // Filter expenses by date range
    const filteredExpenses = filterByDateRange(
      expenses.map((e) => ({ ...e, date: e.date })),
      dateRange
    );

    // Calculate totals
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);

    // Group expenses by category
    const categoryTotals = new Map<string, number>();
    filteredExpenses.forEach((expense) => {
      const category = getCategoryFromLabel(expense.label);
      categoryTotals.set(
        category,
        (categoryTotals.get(category) || 0) + expense.amount
      );
    });

    // Calculate daily budget based on days in range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const daysInRange = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const dailyBudgetTotal = DEFAULT_DAILY_LIMIT * daysInRange;

    // Build nodes
    const nodes: CashFlowNode[] = [];
    const links: CashFlowLink[] = [];

    // Income nodes (left)
    incomes.forEach((income) => {
      nodes.push({
        id: `income-${income.id}`,
        name: income.label,
        type: "income",
        color: "#10b981",
      });
    });

    // Allocation nodes (middle)
    nodes.push({
      id: "alloc-daily",
      name: "Daily Budget",
      type: "allocation",
      color: "#f59e0b",
    });
    nodes.push({
      id: "alloc-bills",
      name: "Bills",
      type: "allocation",
      color: "#ef4444",
    });
    if (flexBucketAllocation > 0) {
      nodes.push({
        id: "alloc-flex",
        name: "Flex Bucket",
        type: "allocation",
        color: "#8b5cf6",
      });
    }
    if (savingsAllocation > 0) {
      nodes.push({
        id: "alloc-savings",
        name: "Savings",
        type: "allocation",
        color: "#10b981",
      });
    }

    // Category nodes (right) - only for categories with spending
    categoryTotals.forEach((amount, category) => {
      if (amount > 0) {
        nodes.push({
          id: `cat-${category.replace(/\s+/g, "-").toLowerCase()}`,
          name: category,
          type: "category",
          color: "#78716c",
        });
      }
    });

    // Bill nodes (right)
    bills.forEach((bill) => {
      nodes.push({
        id: `bill-${bill.id}`,
        name: bill.label,
        type: "expense",
        color: "#ef4444",
      });
    });

    // Links from income to allocations
    // Distribute income proportionally to allocations
    const totalAllocations = dailyBudgetTotal + totalBills + flexBucketAllocation + savingsAllocation;

    if (totalIncome > 0 && totalAllocations > 0) {
      incomes.forEach((income) => {
        const incomeShare = income.amount / totalIncome;

        // To daily budget
        links.push({
          source: `income-${income.id}`,
          target: "alloc-daily",
          value: Math.round(dailyBudgetTotal * incomeShare),
        });

        // To bills
        if (totalBills > 0) {
          links.push({
            source: `income-${income.id}`,
            target: "alloc-bills",
            value: Math.round(totalBills * incomeShare),
          });
        }

        // To flex bucket
        if (flexBucketAllocation > 0) {
          links.push({
            source: `income-${income.id}`,
            target: "alloc-flex",
            value: Math.round(flexBucketAllocation * incomeShare),
          });
        }

        // To savings
        if (savingsAllocation > 0) {
          links.push({
            source: `income-${income.id}`,
            target: "alloc-savings",
            value: Math.round(savingsAllocation * incomeShare),
          });
        }
      });
    }

    // Links from daily budget to categories
    const totalCategorySpending = Array.from(categoryTotals.values()).reduce(
      (sum, amt) => sum + amt,
      0
    );
    categoryTotals.forEach((amount, category) => {
      if (amount > 0) {
        links.push({
          source: "alloc-daily",
          target: `cat-${category.replace(/\s+/g, "-").toLowerCase()}`,
          value: amount,
        });
      }
    });

    // Links from bills allocation to individual bills
    bills.forEach((bill) => {
      links.push({
        source: "alloc-bills",
        target: `bill-${bill.id}`,
        value: bill.amount,
      });
    });

    // Filter out links with zero or negative values
    const validLinks = links.filter((link) => link.value > 0);

    return { nodes, links: validLinks };
  }, [expenses, incomes, bills, dateRange, savingsAllocation, flexBucketAllocation]);
}
