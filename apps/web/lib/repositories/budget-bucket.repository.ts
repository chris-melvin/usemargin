import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BudgetBucket,
  BudgetBucketInsert,
  BudgetBucketUpdate,
  ExpenseBucketRule,
  ExpenseBucketRuleInsert,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for budget bucket operations
 */
class BudgetBucketRepository extends BaseRepository<
  BudgetBucket,
  BudgetBucketInsert,
  BudgetBucketUpdate
> {
  protected tableName = "budget_buckets";

  /**
   * Find all buckets for a user, ordered by sort_order
   */
  async findAllOrdered(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as BudgetBucket[];
  }

  /**
   * Find the default bucket for a user (where expenses go by default)
   */
  async findDefault(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as BudgetBucket;
  }

  /**
   * Find bucket by slug
   */
  async findBySlug(
    supabase: SupabaseClient,
    userId: string,
    slug: string
  ): Promise<BudgetBucket | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as BudgetBucket;
  }

  /**
   * Set a bucket as the default (and unset all others) - ATOMIC
   * Uses PostgreSQL function to prevent race conditions where concurrent
   * calls could result in 0 or 2 default buckets
   */
  async setDefault(
    supabase: SupabaseClient,
    userId: string,
    bucketId: string
  ): Promise<void> {
    // Use atomic RPC function to ensure exactly one bucket is default
    const { error } = await supabase.rpc("set_default_bucket", {
      p_user_id: userId,
      p_bucket_id: bucketId,
    });

    if (error) {
      console.error("Failed to set default bucket atomically:", error);
      throw error;
    }
  }

  /**
   * Update bucket percentages (batch update)
   */
  async updatePercentages(
    supabase: SupabaseClient,
    userId: string,
    updates: Array<{ id: string; percentage: number; allocated_amount?: number }>
  ): Promise<void> {
    // Update each bucket
    for (const update of updates) {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          percentage: update.percentage,
          allocated_amount: update.allocated_amount,
        })
        .eq("id", update.id)
        .eq("user_id", userId);

      if (error) throw error;
    }
  }

  /**
   * Create default buckets for a new user
   */
  async createDefaultBuckets(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BudgetBucket[]> {
    const defaultBuckets: BudgetBucketInsert[] = [
      {
        user_id: userId,
        name: "Savings",
        slug: "savings",
        percentage: 20,
        color: "#22c55e",
        icon: "PiggyBank",
        is_default: false,
        is_system: true,
        sort_order: 0,
      },
      {
        user_id: userId,
        name: "Daily Spending",
        slug: "daily-spending",
        percentage: 80,
        color: "#3b82f6",
        icon: "Wallet",
        is_default: true, // Default bucket for expenses
        is_system: true,
        sort_order: 1,
      },
    ];

    return this.createMany(supabase, defaultBuckets);
  }

  /**
   * Get total percentage allocation
   */
  async getTotalPercentage(
    supabase: SupabaseClient,
    userId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("percentage")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).reduce((sum, b) => sum + Number(b.percentage), 0);
  }

  /**
   * Reorder buckets
   */
  async reorder(
    supabase: SupabaseClient,
    userId: string,
    bucketIds: string[]
  ): Promise<void> {
    for (let i = 0; i < bucketIds.length; i++) {
      const { error } = await supabase
        .from(this.tableName)
        .update({ sort_order: i })
        .eq("id", bucketIds[i])
        .eq("user_id", userId);

      if (error) throw error;
    }
  }

  /**
   * Check if user has completed bucket setup
   */
  async hasSetupBuckets(
    supabase: SupabaseClient,
    userId: string
  ): Promise<boolean> {
    const count = await this.count(supabase, userId);
    return count > 0;
  }
}

/**
 * Repository for expense bucket rule operations
 */
class ExpenseBucketRuleRepository {
  private tableName = "expense_bucket_rules";

  /**
   * Find all rules for a user, ordered by priority
   */
  async findAll(
    supabase: SupabaseClient,
    userId: string
  ): Promise<ExpenseBucketRule[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExpenseBucketRule[];
  }

  /**
   * Find rules for a specific bucket
   */
  async findByBucket(
    supabase: SupabaseClient,
    userId: string,
    bucketId: string
  ): Promise<ExpenseBucketRule[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("bucket_id", bucketId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExpenseBucketRule[];
  }

  /**
   * Create a new rule
   */
  async create(
    supabase: SupabaseClient,
    data: ExpenseBucketRuleInsert
  ): Promise<ExpenseBucketRule> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as object)
      .select()
      .single();

    if (error) throw error;
    return created as ExpenseBucketRule;
  }

  /**
   * Delete a rule
   */
  async delete(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Find matching bucket for an expense based on rules
   * Returns the bucket_id that matches, or null if no match
   */
  async findMatchingBucket(
    supabase: SupabaseClient,
    userId: string,
    expense: { label: string; category?: string | null }
  ): Promise<string | null> {
    const rules = await this.findAll(supabase, userId);

    for (const rule of rules) {
      const matchValue = rule.match_value.toLowerCase();

      switch (rule.match_type) {
        case "label":
          if (expense.label.toLowerCase() === matchValue) {
            return rule.bucket_id;
          }
          break;
        case "keyword":
          if (expense.label.toLowerCase().includes(matchValue)) {
            return rule.bucket_id;
          }
          break;
        case "category":
          if (expense.category?.toLowerCase() === matchValue) {
            return rule.bucket_id;
          }
          break;
      }
    }

    return null; // No match, will use default bucket
  }
}

// Export singleton instances
export const budgetBucketRepository = new BudgetBucketRepository();
export const expenseBucketRuleRepository = new ExpenseBucketRuleRepository();
