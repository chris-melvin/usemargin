import type { SupabaseClient } from "@supabase/supabase-js";
import type { Income, IncomeInsert, IncomeUpdate } from "@repo/database";
import { BaseFinancialRepository } from "./base-financial.repository";
import * as dateUtils from "@/lib/utils/date";

/**
 * Repository for income operations
 *
 * Provides timezone-aware income queries using timestamp fields.
 * All date-related methods now use TIMESTAMPTZ for proper timezone handling.
 */
class IncomeRepository extends BaseFinancialRepository<
  Income,
  IncomeInsert,
  IncomeUpdate
> {
  protected tableName = "incomes";
  protected timestampColumn = "expected_timestamp"; // Primary timestamp for queries

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
   *
   * @param supabase - Supabase client
   * @param id - Income ID
   * @param userId - User ID
   * @param receivedTimestamp - When income was received (defaults to now)
   * @param timezone - User's timezone (for default timestamp)
   * @returns Updated income record
   */
  async markAsReceived(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    receivedTimestamp?: string,
    timezone?: string
  ): Promise<Income> {
    const timestamp = receivedTimestamp ??
      (timezone ? dateUtils.getCurrentTimestamp(timezone) : new Date().toISOString());

    return this.update(supabase, id, userId, {
      status: "received",
      received_timestamp: timestamp,
    });
  }

  /**
   * Reset income status (for recurring incomes at start of month)
   *
   * @param supabase - Supabase client
   * @param id - Income ID
   * @param userId - User ID
   * @returns Updated income record
   */
  async resetStatus(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Income> {
    return this.update(supabase, id, userId, {
      status: "expected",
      received_timestamp: null,
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
