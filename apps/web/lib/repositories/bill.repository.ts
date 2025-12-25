import type { SupabaseClient } from "@supabase/supabase-js";
import type { Debt, DebtInsert, DebtUpdate } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for bill/debt operations
 * Note: Uses the "debts" table but we call them "bills" in the UI
 */
class BillRepository extends BaseRepository<Debt, DebtInsert, DebtUpdate> {
  protected tableName = "debts";

  /**
   * Find all active bills for a user
   */
  async findActive(supabase: SupabaseClient, userId: string): Promise<Debt[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Debt[];
  }

  /**
   * Find bills by status
   */
  async findByStatus(
    supabase: SupabaseClient,
    userId: string,
    status: "pending" | "paid" | "overdue" | "partially_paid"
  ): Promise<Debt[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .eq("is_active", true)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Debt[];
  }

  /**
   * Find overdue bills
   */
  async findOverdue(
    supabase: SupabaseClient,
    userId: string,
    currentDay: number
  ): Promise<Debt[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("status", "pending")
      .lt("due_date", currentDay);

    if (error) throw error;
    return (data ?? []) as Debt[];
  }

  /**
   * Find upcoming bills (due within next N days)
   */
  async findUpcoming(
    supabase: SupabaseClient,
    userId: string,
    daysAhead: number
  ): Promise<Debt[]> {
    const today = new Date();
    const currentDay = today.getDate();
    const futureDay = currentDay + daysAhead;

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("status", "pending")
      .gte("due_date", currentDay)
      .lte("due_date", futureDay);

    if (error) throw error;
    return (data ?? []) as Debt[];
  }

  /**
   * Mark a bill as paid
   */
  async markAsPaid(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    paidDate?: string
  ): Promise<Debt> {
    return this.update(supabase, id, userId, {
      status: "paid",
      paid_date: paidDate ?? new Date().toISOString().split("T")[0],
    });
  }

  /**
   * Reset bill status (for recurring bills at start of month)
   */
  async resetStatus(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Debt> {
    return this.update(supabase, id, userId, {
      status: "pending",
      paid_date: null,
    });
  }

  /**
   * Get total pending amount for a user
   */
  async getTotalPending(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("status", "pending");

    if (error) throw error;
    return (data ?? []).reduce((sum, b) => sum + Number(b.amount), 0);
  }

  /**
   * Soft delete (deactivate) a bill
   */
  async deactivate(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<Debt> {
    return this.update(supabase, id, userId, { is_active: false });
  }
}

// Export singleton instance
export const billRepository = new BillRepository();
