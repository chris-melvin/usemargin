import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for expense operations
 */
class ExpenseRepository extends BaseRepository<
  Expense,
  ExpenseInsert,
  ExpenseUpdate
> {
  protected tableName = "expenses";

  /**
   * Find expenses within a date range
   */
  async findByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Expense[];
  }

  /**
   * Find expenses for a specific month
   */
  async findByMonth(
    supabase: SupabaseClient,
    userId: string,
    year: number,
    month: number // 0-indexed like JS Date
  ): Promise<Expense[]> {
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return this.findByDateRange(supabase, userId, startDate, endDate);
  }

  /**
   * Find expenses for a specific date
   */
  async findByDate(
    supabase: SupabaseClient,
    userId: string,
    date: string
  ): Promise<Expense[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Expense[];
  }

  /**
   * Get total spent for a specific date
   */
  async getTotalForDate(
    supabase: SupabaseClient,
    userId: string,
    date: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId)
      .eq("date", date);

    if (error) throw error;
    return (data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  }

  /**
   * Get total spent for a date range
   */
  async getTotalForDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
    return (data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  }

  /**
   * Get expenses grouped by category for a date range
   */
  async getByCategory(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ category: string | null; total: number; count: number }[]> {
    const expenses = await this.findByDateRange(
      supabase,
      userId,
      startDate,
      endDate
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
   * Get daily totals for a date range
   */
  async getDailyTotals(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ date: string; total: number }[]> {
    const expenses = await this.findByDateRange(
      supabase,
      userId,
      startDate,
      endDate
    );

    const dailyMap = new Map<string, number>();

    for (const expense of expenses) {
      const current = dailyMap.get(expense.date) ?? 0;
      dailyMap.set(expense.date, current + expense.amount);
    }

    return Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Find recent expenses (for quick access/suggestions)
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
      .order("created_at", { ascending: false })
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
