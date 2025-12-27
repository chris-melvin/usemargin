import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserCredits,
  UserCreditsInsert,
  UserCreditsUpdate,
  CreditTransaction,
  CreditTransactionInsert,
  CreditTransactionType,
  AIFeatureId,
} from "@repo/database";

/**
 * Repository for user credits operations
 * Each user has exactly one credits record
 */
class CreditsRepository {
  private tableName = "user_credits";

  /**
   * Get credits for a user (creates default if not exists)
   */
  async getOrCreate(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserCredits> {
    // Try to get existing credits
    const { data: existing, error: fetchError } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing && !fetchError) {
      return existing as UserCredits;
    }

    // If not found (PGRST116), create default credits record
    if (fetchError?.code === "PGRST116") {
      const defaultCredits: UserCreditsInsert = {
        user_id: userId,
        balance: 0, // Free tier starts with 0 credits
        subscription_credits_per_month: 0,
        total_granted: 0,
        total_consumed: 0,
        total_purchased: 0,
      };

      const { data: created, error: createError } = await supabase
        .from(this.tableName)
        .insert(defaultCredits)
        .select()
        .single();

      if (createError) throw createError;
      return created as UserCredits;
    }

    throw fetchError;
  }

  /**
   * Get credits for a user (returns null if not exists)
   */
  async get(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserCredits | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as UserCredits;
  }

  /**
   * Update credits for a user
   */
  async update(
    supabase: SupabaseClient,
    userId: string,
    data: UserCreditsUpdate
  ): Promise<UserCredits> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as UserCredits;
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number
  ): Promise<boolean> {
    const credits = await this.getOrCreate(supabase, userId);
    return credits.balance >= amount;
  }

  /**
   * Add credits to user balance
   * Used for subscription grants, purchases, and refunds
   */
  async addCredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number,
    transactionType: Exclude<CreditTransactionType, "consumption">,
    description: string,
    referenceId?: string
  ): Promise<UserCredits> {
    const current = await this.getOrCreate(supabase, userId);
    const newBalance = current.balance + amount;

    // Create transaction record
    await creditTransactionRepository.create(supabase, {
      user_id: userId,
      transaction_type: transactionType,
      amount: amount, // Positive for adding
      balance_before: current.balance,
      balance_after: newBalance,
      description,
      reference_id: referenceId ?? null,
    });

    // Update balance and stats
    const updates: UserCreditsUpdate = {
      balance: newBalance,
    };

    if (transactionType === "subscription_grant") {
      updates.total_granted = current.total_granted + amount;
      updates.last_refresh_at = new Date().toISOString();
      // Set next refresh to 1 month from now
      const nextRefresh = new Date();
      nextRefresh.setMonth(nextRefresh.getMonth() + 1);
      updates.next_refresh_at = nextRefresh.toISOString();
    } else if (transactionType === "purchase") {
      updates.total_purchased = current.total_purchased + amount;
    }

    return this.update(supabase, userId, updates);
  }

  /**
   * Consume credits for AI feature usage
   * Returns updated credits or null if insufficient
   */
  async consumeCredits(
    supabase: SupabaseClient,
    userId: string,
    amount: number,
    featureId: AIFeatureId,
    description: string
  ): Promise<UserCredits | null> {
    const current = await this.getOrCreate(supabase, userId);

    if (current.balance < amount) {
      return null; // Insufficient credits
    }

    const newBalance = current.balance - amount;

    // Create transaction record
    await creditTransactionRepository.create(supabase, {
      user_id: userId,
      transaction_type: "consumption",
      amount: -amount, // Negative for consumption
      balance_before: current.balance,
      balance_after: newBalance,
      description,
      feature_id: featureId,
    });

    // Update balance and stats
    return this.update(supabase, userId, {
      balance: newBalance,
      total_consumed: current.total_consumed + amount,
    });
  }

  /**
   * Set subscription tier credits (called when subscription changes)
   */
  async setSubscriptionCredits(
    supabase: SupabaseClient,
    userId: string,
    creditsPerMonth: number
  ): Promise<UserCredits> {
    return this.update(supabase, userId, {
      subscription_credits_per_month: creditsPerMonth,
    });
  }

  /**
   * Get users due for monthly credit refresh (for cron job)
   */
  async getUsersDueForRefresh(
    supabase: SupabaseClient
  ): Promise<UserCredits[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .gt("subscription_credits_per_month", 0)
      .lte("next_refresh_at", now);

    if (error) throw error;
    return (data ?? []) as UserCredits[];
  }
}

/**
 * Repository for credit transaction operations (audit log)
 */
class CreditTransactionRepository {
  private tableName = "credit_transactions";

  /**
   * Create a transaction record
   */
  async create(
    supabase: SupabaseClient,
    data: CreditTransactionInsert
  ): Promise<CreditTransaction> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as CreditTransaction;
  }

  /**
   * Get transactions for a user
   */
  async findByUser(
    supabase: SupabaseClient,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: CreditTransactionType;
    }
  ): Promise<CreditTransaction[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.type) {
      query = query.eq("transaction_type", options.type);
    }

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
    return (data ?? []) as CreditTransaction[];
  }

  /**
   * Get recent transactions for a user
   */
  async getRecent(
    supabase: SupabaseClient,
    userId: string,
    limit = 10
  ): Promise<CreditTransaction[]> {
    return this.findByUser(supabase, userId, { limit });
  }

  /**
   * Get usage stats by feature for analytics
   */
  async getUsageStats(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ feature_id: AIFeatureId; total_used: number }[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("feature_id")
      .eq("user_id", userId)
      .eq("transaction_type", "consumption")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .not("feature_id", "is", null);

    if (error) throw error;

    // Aggregate by feature
    const stats = (data ?? []).reduce(
      (acc, tx) => {
        const featureId = tx.feature_id as AIFeatureId;
        acc[featureId] = (acc[featureId] ?? 0) + 1;
        return acc;
      },
      {} as Record<AIFeatureId, number>
    );

    return Object.entries(stats).map(([feature_id, total_used]) => ({
      feature_id: feature_id as AIFeatureId,
      total_used,
    }));
  }
}

// Export singleton instances
export const creditsRepository = new CreditsRepository();
export const creditTransactionRepository = new CreditTransactionRepository();
