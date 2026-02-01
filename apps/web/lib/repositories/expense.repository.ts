import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "@repo/database";
import { BaseFinancialRepository } from "./base-financial.repository";
import * as dateUtils from "@/lib/utils/date";

/**
 * Repository for expense operations
 *
 * Provides timezone-aware expense queries using occurred_at timestamps.
 * All date-related methods now use TIMESTAMPTZ for proper timezone handling.
 */
class ExpenseRepository extends BaseFinancialRepository<
  Expense,
  ExpenseInsert,
  ExpenseUpdate
> {
  protected tableName = "expenses";
  protected timestampColumn = "occurred_at";

  /**
   * Find expenses within a date range in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Array of expenses in the date range
   */
  async findByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string
  ): Promise<Expense[]> {
    const { start, end } = dateUtils.dateRangeToTimestamps(
      startDate,
      endDate,
      timezone,
      true // Include full day
    );

    return this.findByTimestampRange(supabase, userId, start, end);
  }

  /**
   * Find expenses for a specific month in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param year - Year (e.g., 2024)
   * @param month - Month (0-indexed, like JS Date: 0 = January)
   * @param timezone - User's timezone
   * @returns Array of expenses in the month
   */
  async findByMonth(
    supabase: SupabaseClient,
    userId: string,
    year: number,
    month: number,
    timezone: string
  ): Promise<Expense[]> {
    // Create first and last day of month
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return this.findByDateRange(supabase, userId, startDate, endDate, timezone);
  }

  /**
   * Find expenses for a specific date in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param date - Date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Array of expenses on that date
   */
  async findByDate(
    supabase: SupabaseClient,
    userId: string,
    date: string,
    timezone: string
  ): Promise<Expense[]> {
    return this.findByDateInTimezone(supabase, userId, date, timezone);
  }

  /**
   * Get total spent for a specific date in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param date - Date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Total amount spent
   */
  async getTotalForDate(
    supabase: SupabaseClient,
    userId: string,
    date: string,
    timezone: string
  ): Promise<number> {
    const { start, end } = dateUtils.dateRangeToTimestamps(
      date,
      date,
      timezone,
      true
    );

    return this.sumByTimestampRange(supabase, userId, start, end);
  }

  /**
   * Get total spent for a date range in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Total amount spent
   */
  async getTotalForDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string
  ): Promise<number> {
    const { start, end } = dateUtils.dateRangeToTimestamps(
      startDate,
      endDate,
      timezone,
      true
    );

    return this.sumByTimestampRange(supabase, userId, start, end);
  }

  /**
   * Get expenses grouped by category for a date range
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Array of category totals sorted by amount
   */
  async getByCategory(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string
  ): Promise<{ category: string | null; total: number; count: number }[]> {
    const expenses = await this.findByDateRange(
      supabase,
      userId,
      startDate,
      endDate,
      timezone
    );

    const categoryMap = new Map<
      string | null,
      { total: number; count: number }
    >();

    for (const expense of expenses) {
      const key = expense.category;
      const current = categoryMap.get(key) ?? { total: 0, count: 0 };
      categoryMap.set(key, {
        total: current.total + expense.amount,
        count: current.count + 1,
      });
    }

    return Array.from(categoryMap.entries())
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Get daily totals for a date range in user's timezone
   * Overrides base method to provide expense-specific implementation
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Array of daily totals sorted by date
   */
  async getDailyTotalsForDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string
  ): Promise<{ date: string; total: number }[]> {
    const { start, end } = dateUtils.dateRangeToTimestamps(
      startDate,
      endDate,
      timezone,
      true
    );

    // Use base class method
    return super.getDailyTotals(supabase, userId, start, end, timezone);
  }

  /**
   * Find recent expenses (for quick access/suggestions)
   * Ordered by when expense occurred, not when it was created
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param limit - Maximum number of results
   * @returns Array of recent expenses
   */
  async findRecent(
    supabase: SupabaseClient,
    userId: string,
    limit = 10
  ): Promise<Expense[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Expense[];
  }

  /**
   * Search expenses by label
   */
  async searchByLabel(
    supabase: SupabaseClient,
    userId: string,
    query: string,
    limit = 20
  ): Promise<Expense[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .ilike("label", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Expense[];
  }

  /**
   * Soft delete an expense by setting deleted_at timestamp
   * Returns the deleted expense for undo functionality
   */
  async softDelete(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Expense | null> {
    const { data, error } = await supabase
      .rpc("soft_delete_expense", { expense_id: id });

    if (error) throw error;
    return data as Expense | null;
  }

  /**
   * Restore a soft-deleted expense by clearing deleted_at
   * Returns the restored expense
   */
  async restore(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Expense | null> {
    const { data, error } = await supabase
      .rpc("restore_expense", { expense_id: id });

    if (error) throw error;
    return data as Expense | null;
  }

  /**
   * Find deleted expenses for a user (for restore functionality)
   */
  async findDeleted(
    supabase: SupabaseClient,
    userId: string,
    limit = 20
  ): Promise<Expense[]> {
    // This query uses the "Users can view their own deleted expenses" RLS policy
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Expense[];
  }
}

// Export singleton instance
export const expenseRepository = new ExpenseRepository();
