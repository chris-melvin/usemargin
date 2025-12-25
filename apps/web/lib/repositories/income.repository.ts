import type { SupabaseClient } from "@supabase/supabase-js";
import type { Income, IncomeInsert, IncomeUpdate } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for income operations
 */
class IncomeRepository extends BaseRepository<
  Income,
  IncomeInsert,
  IncomeUpdate
> {
  protected tableName = "incomes";

  /**
   * Find all active incomes for a user
   */
  async findActive(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Income[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("day_of_month", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Income[];
  }

  /**
   * Find incomes by status
   */
  async findByStatus(
    supabase: SupabaseClient,
    userId: string,
    status: "pending" | "expected" | "received"
  ): Promise<Income[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .eq("is_active", true);

    if (error) throw error;
    return (data ?? []) as Income[];
  }

  /**
   * Find upcoming incomes (expected within next N days)
   */
  async findUpcoming(
    supabase: SupabaseClient,
    userId: string,
    daysAhead: number
  ): Promise<Income[]> {
    const today = new Date();
    const currentDay = today.getDate();
    const futureDay = currentDay + daysAhead;

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("status", ["pending", "expected"])
      .gte("day_of_month", currentDay)
      .lte("day_of_month", futureDay);

    if (error) throw error;
    return (data ?? []) as Income[];
  }

  /**
   * Mark income as received
   */
  async markAsReceived(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    receivedDate?: string
  ): Promise<Income> {
    return this.update(supabase, id, userId, {
      status: "received",
      received_date: receivedDate ?? new Date().toISOString().split("T")[0],
    });
  }

  /**
   * Reset income status (for recurring incomes at start of month)
   */
  async resetStatus(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Income> {
    return this.update(supabase, id, userId, {
      status: "expected",
      received_date: null,
    });
  }

  /**
   * Get total expected income for current month
   */
  async getTotalExpected(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("status", ["pending", "expected"]);

    if (error) throw error;
    return (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  }

  /**
   * Get total received income for current month
   */
  async getTotalReceived(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("status", "received");

    if (error) throw error;
    return (data ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  }

  /**
   * Soft delete (deactivate) an income
   */
  async deactivate(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Income> {
    return this.update(supabase, id, userId, { is_active: false });
  }
}

// Export singleton instance
export const incomeRepository = new IncomeRepository();
