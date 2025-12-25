"use server";

import { expenseRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Expense } from "@repo/database";

/**
 * Get expenses for a specific month
 */
export async function getExpensesForMonth(
  year: number,
  month: number // 0-indexed like JS Date
): Promise<ActionResult<Expense[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.findByMonth(
      supabase,
      userId,
      year,
      month
    );
    return success(expenses);
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    return error("Failed to fetch expenses", "DATABASE_ERROR");
  }
}

/**
 * Get expenses for a date range
 */
export async function getExpensesForDateRange(
  startDate: string,
  endDate: string
): Promise<ActionResult<Expense[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.findByDateRange(
      supabase,
      userId,
      startDate,
      endDate
    );
    return success(expenses);
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    return error("Failed to fetch expenses", "DATABASE_ERROR");
  }
}

/**
 * Get expenses for a specific date
 */
export async function getExpensesForDate(
  date: string
): Promise<ActionResult<Expense[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.findByDate(supabase, userId, date);
    return success(expenses);
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    return error("Failed to fetch expenses", "DATABASE_ERROR");
  }
}

/**
 * Get total spent for a specific date
 */
export async function getTotalForDate(
  date: string
): Promise<ActionResult<number>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const total = await expenseRepository.getTotalForDate(
      supabase,
      userId,
      date
    );
    return success(total);
  } catch (err) {
    console.error("Failed to fetch total:", err);
    return error("Failed to fetch total", "DATABASE_ERROR");
  }
}

/**
 * Get expenses grouped by category for a date range
 */
export async function getExpensesByCategory(
  startDate: string,
  endDate: string
): Promise<
  ActionResult<{ category: string | null; total: number; count: number }[]>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const byCategory = await expenseRepository.getByCategory(
      supabase,
      userId,
      startDate,
      endDate
    );
    return success(byCategory);
  } catch (err) {
    console.error("Failed to fetch expenses by category:", err);
    return error("Failed to fetch expenses by category", "DATABASE_ERROR");
  }
}

/**
 * Get daily totals for a date range
 */
export async function getDailyTotals(
  startDate: string,
  endDate: string
): Promise<ActionResult<{ date: string; total: number }[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const dailyTotals = await expenseRepository.getDailyTotals(
      supabase,
      userId,
      startDate,
      endDate
    );
    return success(dailyTotals);
  } catch (err) {
    console.error("Failed to fetch daily totals:", err);
    return error("Failed to fetch daily totals", "DATABASE_ERROR");
  }
}

/**
 * Get recent expenses
 */
export async function getRecentExpenses(
  limit = 10
): Promise<ActionResult<Expense[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.findRecent(
      supabase,
      userId,
      limit
    );
    return success(expenses);
  } catch (err) {
    console.error("Failed to fetch recent expenses:", err);
    return error("Failed to fetch recent expenses", "DATABASE_ERROR");
  }
}

/**
 * Search expenses by label
 */
export async function searchExpenses(
  query: string,
  limit = 20
): Promise<ActionResult<Expense[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const expenses = await expenseRepository.searchByLabel(
      supabase,
      userId,
      query,
      limit
    );
    return success(expenses);
  } catch (err) {
    console.error("Failed to search expenses:", err);
    return error("Failed to search expenses", "DATABASE_ERROR");
  }
}
