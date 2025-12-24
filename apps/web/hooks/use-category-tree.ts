"use client";

import { useMemo } from "react";
import type { LocalExpense, SpendingNode, DateRange } from "@/lib/types";
import { filterByDateRange } from "./use-timeframe";

// Category mapping with subcategories
const CATEGORY_CONFIG: Record<string, { parent: string; color?: string }> = {
  coffee: { parent: "Food & Drinks" },
  lunch: { parent: "Food & Drinks" },
  dinner: { parent: "Food & Drinks" },
  breakfast: { parent: "Food & Drinks" },
  snack: { parent: "Food & Drinks" },
  grab: { parent: "Food & Drinks" },
  grabfood: { parent: "Food & Drinks" },
  foodpanda: { parent: "Food & Drinks" },
  commute: { parent: "Transportation" },
  taxi: { parent: "Transportation" },
  uber: { parent: "Transportation" },
  fuel: { parent: "Transportation" },
  gas: { parent: "Transportation" },
  groceries: { parent: "Essentials" },
  utilities: { parent: "Essentials" },
  rent: { parent: "Essentials" },
  internet: { parent: "Essentials" },
  shopping: { parent: "Lifestyle" },
  entertainment: { parent: "Lifestyle" },
  movies: { parent: "Lifestyle" },
  gym: { parent: "Lifestyle" },
  subscription: { parent: "Lifestyle" },
};

// Subcategory display names
const SUBCATEGORY_NAMES: Record<string, string> = {
  coffee: "Coffee",
  lunch: "Lunch",
  dinner: "Dinner",
  breakfast: "Breakfast",
  snack: "Snacks",
  grab: "Grab/Delivery",
  grabfood: "Grab/Delivery",
  foodpanda: "Delivery",
  commute: "Commute",
  taxi: "Taxi/Ride",
  uber: "Uber",
  fuel: "Fuel",
  gas: "Gas",
  groceries: "Groceries",
  utilities: "Utilities",
  rent: "Rent",
  internet: "Internet",
  shopping: "Shopping",
  entertainment: "Entertainment",
  movies: "Movies",
  gym: "Gym",
  subscription: "Subscriptions",
};

// Get category info from expense label
function getCategoryInfo(label: string): { parent: string; subcategory: string } {
  const lowerLabel = label.toLowerCase();

  for (const [trigger, config] of Object.entries(CATEGORY_CONFIG)) {
    if (lowerLabel.includes(trigger)) {
      return {
        parent: config.parent,
        subcategory: SUBCATEGORY_NAMES[trigger] || trigger,
      };
    }
  }

  return { parent: "Other", subcategory: label };
}

interface UseCategoryTreeProps {
  expenses: LocalExpense[];
  dateRange: DateRange;
}

export function useCategoryTree({
  expenses,
  dateRange,
}: UseCategoryTreeProps): SpendingNode {
  return useMemo(() => {
    // Filter expenses by date range
    const filteredExpenses = filterByDateRange(
      expenses.map((e) => ({ ...e, date: e.date })),
      dateRange
    );

    // Build category hierarchy
    const categoryMap = new Map<string, Map<string, number>>();

    filteredExpenses.forEach((expense) => {
      const { parent, subcategory } = getCategoryInfo(expense.label);

      if (!categoryMap.has(parent)) {
        categoryMap.set(parent, new Map());
      }

      const subcategoryMap = categoryMap.get(parent)!;
      subcategoryMap.set(
        subcategory,
        (subcategoryMap.get(subcategory) || 0) + expense.amount
      );
    });

    // Convert to SpendingNode tree
    const children: SpendingNode[] = [];

    categoryMap.forEach((subcategoryMap, parentName) => {
      const subcategoryChildren: SpendingNode[] = [];

      subcategoryMap.forEach((amount, subcategoryName) => {
        subcategoryChildren.push({
          name: subcategoryName,
          value: amount,
        });
      });

      // Sort subcategories by value (descending)
      subcategoryChildren.sort((a, b) => (b.value || 0) - (a.value || 0));

      // Calculate parent total
      const parentTotal = subcategoryChildren.reduce(
        (sum, child) => sum + (child.value || 0),
        0
      );

      children.push({
        name: parentName,
        value: parentTotal,
        children: subcategoryChildren,
      });
    });

    // Sort categories by value (descending)
    children.sort((a, b) => (b.value || 0) - (a.value || 0));

    return {
      name: "Spending",
      children,
    };
  }, [expenses, dateRange]);
}
