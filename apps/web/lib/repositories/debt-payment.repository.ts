import type { SupabaseClient } from "@supabase/supabase-js";
import type { DebtPayment, DebtPaymentInsert, DebtPaymentUpdate } from "@repo/database";
import { BaseFinancialRepository } from "./base-financial.repository";
import * as dateUtils from "@/lib/utils/date";

/**
 * Repository for debt payment history operations
 *
 * Updated to use timestamp fields for proper timezone handling.
 */
class DebtPaymentRepository extends BaseFinancialRepository<DebtPayment, DebtPaymentInsert, DebtPaymentUpdate> {
  protected tableName = "debt_payments";
  protected timestampColumn = "payment_timestamp";

  /**
   * Find all payments for a specific debt
   */
  async findByDebtId(
    supabase: SupabaseClient,
    debtId: string,
    userId: string
  ): Promise<DebtPayment[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .order("payment_timestamp", { ascending: false });

    if (error) throw error;
    return (data ?? []) as DebtPayment[];
  }

  /**
   * Find payments within a date range in user's timezone
   *
   * @param supabase - Supabase client
   * @param userId - User ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param timezone - User's timezone
   * @returns Array of payments in the date range
   */
  async findByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string
  ): Promise<DebtPayment[]> {
    const { start, end } = dateUtils.dateRangeToTimestamps(
      startDate,
      endDate,
      timezone,
      true
    );

    return this.findByTimestampRange(supabase, userId, start, end);
  }

  /**
   * Find payment for a specific period
   *
   * @param supabase - Supabase client
   * @param debtId - Debt ID
   * @param userId - User ID
   * @param periodStartTimestamp - Period start timestamp
   * @returns Payment for that period or null
   */
  async findByPeriod(
    supabase: SupabaseClient,
    debtId: string,
    userId: string,
    periodStartTimestamp: string
  ): Promise<DebtPayment | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .eq("period_start_timestamp", periodStartTimestamp)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as DebtPayment;
  }

  /**
   * Get payment stats for a debt (for trends)
   */
  async getPaymentStats(
    supabase: SupabaseClient,
    debtId: string,
    userId: string
  ): Promise<{ avg: number; min: number; max: number; count: number; total: number }> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("debt_id", debtId)
      .eq("user_id", userId);

    if (error) throw error;

    const amounts = (data ?? []).map(p => Number(p.amount));
    if (amounts.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, total: 0 };
    }

    const total = amounts.reduce((a, b) => a + b, 0);
    return {
      avg: total / amounts.length,
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      count: amounts.length,
      total,
    };
  }

  /**
   * Get recent payments for a debt (limited)
   */
  async findRecent(
    supabase: SupabaseClient,
    debtId: string,
    userId: string,
    limit: number = 6
  ): Promise<DebtPayment[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .order("payment_timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as DebtPayment[];
  }

  /**
   * Get total payments made to a debt
   */
  async getTotalPaid(
    supabase: SupabaseClient,
    debtId: string,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("debt_id", debtId)
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  }
}

// Export singleton instance
export const debtPaymentRepository = new DebtPaymentRepository();
