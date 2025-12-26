"use client";

import { useOptimistic, useTransition, useCallback } from "react";
import {
  createExpenseFromData,
  updateExpenseFromData,
  deleteExpense as deleteExpenseAction,
} from "@/actions/expenses";
import type { Expense } from "@repo/database";

/**
 * Optimistic expense with pending state
 */
interface OptimisticExpense extends Expense {
  pending?: boolean;
}

type OptimisticAction =
  | { type: "add"; expense: OptimisticExpense }
  | { type: "add_many"; expenses: OptimisticExpense[] }
  | { type: "delete"; id: string }
  | { type: "update"; id: string; data: Partial<Expense> };

/**
 * Hook for managing expenses with server actions and optimistic updates
 */
export function useServerExpenses(initialExpenses: Expense[]) {
  const [isPending, startTransition] = useTransition();

  // Optimistic state reducer
  const [optimisticExpenses, setOptimisticExpenses] = useOptimistic<
    OptimisticExpense[],
    OptimisticAction
  >(initialExpenses, (state, action) => {
    switch (action.type) {
      case "add":
        return [...state, action.expense];
      case "add_many":
        return [...state, ...action.expenses];
      case "delete":
        return state.filter((e) => e.id !== action.id);
      case "update":
        return state.map((e) =>
          e.id === action.id ? { ...e, ...action.data } : e
        );
      default:
        return state;
    }
  });

  /**
   * Add a single expense with optimistic update
   */
  const addExpense = useCallback(
    async (
      date: Date,
      amount: number,
      label: string,
      options?: { category?: string; bucketId?: string }
    ): Promise<{ success: boolean; error?: string }> => {
      const dateStr = date.toISOString().split("T")[0]!;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticExpense: OptimisticExpense = {
        id: tempId,
        user_id: "", // Will be set by server
        date: dateStr,
        amount,
        label,
        category: options?.category ?? null,
        category_id: null,
        notes: null,
        time_of_day: null,
        occurred_at: new Date().toISOString(),
        recurring_expense_id: null,
        bucket_id: options?.bucketId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pending: true,
      };

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic update
        setOptimisticExpenses({ type: "add", expense: optimisticExpense });

        // Execute server action
        const serverResult = await createExpenseFromData({
          date: dateStr,
          amount,
          label,
          category: options?.category ?? null,
          bucket_id: options?.bucketId ?? null,
          occurred_at: new Date().toISOString(),
        });

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to create expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Add multiple expenses with optimistic update (for AI parser batch add)
   */
  const addExpenses = useCallback(
    async (
      expenses: Array<{ amount: number; label: string; category?: string; bucketId?: string }>,
      date: Date = new Date()
    ): Promise<{ success: boolean; errors: string[] }> => {
      const dateStr = date.toISOString().split("T")[0]!;
      const errors: string[] = [];

      const optimisticExpenses: OptimisticExpense[] = expenses.map(
        (exp, index) => ({
          id: `temp-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`,
          user_id: "",
          date: dateStr,
          amount: exp.amount,
          label: exp.label,
          category: exp.category ?? null,
          category_id: null,
          notes: null,
          time_of_day: null,
          occurred_at: new Date().toISOString(),
          recurring_expense_id: null,
          bucket_id: exp.bucketId ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pending: true,
        })
      );

      startTransition(async () => {
        // Apply optimistic update for all
        setOptimisticExpenses({ type: "add_many", expenses: optimisticExpenses });

        // Execute server actions for each expense
        const results = await Promise.all(
          expenses.map((exp) =>
            createExpenseFromData({
              date: dateStr,
              amount: exp.amount,
              label: exp.label,
              category: exp.category ?? null,
              bucket_id: exp.bucketId ?? null,
              occurred_at: new Date().toISOString(),
            })
          )
        );

        // Collect errors
        results.forEach((result, index) => {
          if (!result.success) {
            errors.push(`${expenses[index]?.label}: ${result.error}`);
          }
        });
      });

      return { success: errors.length === 0, errors };
    },
    [setOptimisticExpenses]
  );

  /**
   * Delete an expense with optimistic update
   */
  const removeExpense = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      // Don't delete temp expenses (they're still being created)
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot delete pending expense" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic delete
        setOptimisticExpenses({ type: "delete", id });

        // Execute server action
        const serverResult = await deleteExpenseAction(id);

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to delete expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Update an expense with optimistic update
   */
  const updateExpense = useCallback(
    async (
      id: string,
      updates: { category?: string | null; bucket_id?: string | null }
    ): Promise<{ success: boolean; error?: string }> => {
      // Don't update temp expenses (they're still being created)
      if (id.startsWith("temp-")) {
        return { success: false, error: "Cannot update pending expense" };
      }

      let result: { success: boolean; error?: string } = { success: true };

      startTransition(async () => {
        // Apply optimistic update
        setOptimisticExpenses({ type: "update", id, data: updates });

        // Execute server action
        const serverResult = await updateExpenseFromData(id, updates);

        if (!serverResult.success) {
          result = { success: false, error: serverResult.error };
          console.error("Failed to update expense:", serverResult.error);
          // Rollback happens automatically when revalidation occurs
        }
      });

      return result;
    },
    [setOptimisticExpenses]
  );

  /**
   * Get expenses for a specific date
   */
  const getExpensesForDate = useCallback(
    (date: Date): OptimisticExpense[] => {
      const dateStr = date.toISOString().split("T")[0];
      return optimisticExpenses.filter((e) => e.date === dateStr);
    },
    [optimisticExpenses]
  );

  /**
   * Get total spent for a specific date
   */
  const getTotalForDate = useCallback(
    (date: Date): number => {
      return getExpensesForDate(date).reduce((sum, e) => sum + e.amount, 0);
    },
    [getExpensesForDate]
  );

  return {
    expenses: optimisticExpenses,
    addExpense,
    addExpenses,
    updateExpense,
    removeExpense,
    getExpensesForDate,
    getTotalForDate,
    isPending,
  };
}
