import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsTransaction, SavingsTransactionInsert } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for savings goal transactions (contributions/withdrawals)
 */
class SavingsTransactionRepository extends BaseRepository<
  SavingsTransaction,
  SavingsTransactionInsert,
  Partial<SavingsTransaction>
> {
  protected tableName = "savings_transactions";

  /**
   * Find all transactions for a specific goal
   */
  async findByGoal(
    supabase: SupabaseClient,
    goalId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<SavingsTransaction[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("savings_goal_id", goalId)
      .eq("user_id", userId)
      .order("transaction_timestamp", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit ?? 10) - 1
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SavingsTransaction[];
  }

  /**
   * Find all contributions (positive amounts) for a user
   */
  async findContributions(
    supabase: SupabaseClient,
    userId: string,
    limit = 20
  ): Promise<SavingsTransaction[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gt("amount", 0)
      .order("transaction_timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as SavingsTransaction[];
  }

  /**
   * Get total contributions for a goal
   */
  async getTotalForGoal(
    supabase: SupabaseClient,
    goalId: string,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("amount")
      .eq("savings_goal_id", goalId)
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  }
}

// Export singleton instance
export const savingsTransactionRepository = new SavingsTransactionRepository();
