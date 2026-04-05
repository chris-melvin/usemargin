import type { SupabaseClient } from "@supabase/supabase-js";
import type { SavingsGoal, SavingsGoalInsert, SavingsGoalUpdate } from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for savings goals
 */
class SavingsGoalRepository extends BaseRepository<SavingsGoal, SavingsGoalInsert, SavingsGoalUpdate> {
  protected tableName = "savings_goals";

  /**
   * Find all active (non-hidden) goals for a user
   */
  async findActive(supabase: SupabaseClient, userId: string): Promise<SavingsGoal[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SavingsGoal[];
  }

  /**
   * Find goals by completion status
   */
  async findByCompletionStatus(
    supabase: SupabaseClient,
    userId: string,
    isCompleted: boolean
  ): Promise<SavingsGoal[]> {
    const operator = isCompleted ? "gte" : "lt";
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_hidden", false)
      [operator]("current_balance", supabase.rpc("get_target_amount", { goal_id: "id" }))
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SavingsGoal[];
  }

  /**
   * Get total saved across all goals
   */
  async getTotalSaved(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("current_balance")
      .eq("user_id", userId)
      .eq("is_hidden", false);

    if (error) throw error;
    return (data ?? []).reduce((sum, g) => sum + Number(g.current_balance), 0);
  }

  /**
   * Get total target amount across all goals
   */
  async getTotalTarget(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("target_amount")
      .eq("user_id", userId)
      .eq("is_hidden", false);

    if (error) throw error;
    return (data ?? []).reduce((sum, g) => sum + Number(g.target_amount), 0);
  }

  /**
   * Contribute to a goal (add to current balance)
   */
  async contribute(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    amount: number
  ): Promise<SavingsGoal> {
    // Get current balance
    const goal = await this.findById(supabase, id, userId);
    if (!goal) throw new Error("Goal not found");

    const newBalance = Number(goal.current_balance) + amount;

    return this.update(supabase, id, userId, {
      current_balance: newBalance,
    });
  }

  /**
   * Withdraw from a goal (subtract from current balance)
   */
  async withdraw(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    amount: number
  ): Promise<SavingsGoal> {
    // Get current balance
    const goal = await this.findById(supabase, id, userId);
    if (!goal) throw new Error("Goal not found");

    const newBalance = Math.max(0, Number(goal.current_balance) - amount);

    return this.update(supabase, id, userId, {
      current_balance: newBalance,
    });
  }

  /**
   * Soft delete (hide) a goal
   */
  async hide(supabase: SupabaseClient, id: string, userId: string): Promise<SavingsGoal> {
    return this.update(supabase, id, userId, { is_hidden: true });
  }

  /**
   * Get goal progress percentage
   */
  getProgressPercentage(goal: SavingsGoal): number {
    if (goal.target_amount === 0) return 0;
    return Math.min(100, Math.round((Number(goal.current_balance) / Number(goal.target_amount)) * 100));
  }

  /**
   * Check if goal is completed
   */
  isCompleted(goal: SavingsGoal): boolean {
    return Number(goal.current_balance) >= Number(goal.target_amount);
  }
}

// Export singleton instance
export const savingsGoalRepository = new SavingsGoalRepository();
