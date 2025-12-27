import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionStatus,
} from "@repo/database";

/**
 * Repository for subscription operations
 * Each user has at most one subscription record
 */
class SubscriptionRepository {
  private tableName = "subscriptions";

  /**
   * Get subscription by user ID
   */
  async getByUserId(
    supabase: SupabaseClient,
    userId: string
  ): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Subscription;
  }

  /**
   * Get subscription by provider subscription ID (for webhook handling)
   */
  async getByProviderSubscriptionId(
    supabase: SupabaseClient,
    providerSubscriptionId: string
  ): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("provider_subscription_id", providerSubscriptionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Subscription;
  }

  /**
   * Create a new subscription
   */
  async create(
    supabase: SupabaseClient,
    data: SubscriptionInsert
  ): Promise<Subscription> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as Subscription;
  }

  /**
   * Create or update subscription (upsert on user_id)
   */
  async upsert(
    supabase: SupabaseClient,
    data: SubscriptionInsert
  ): Promise<Subscription> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .upsert(data, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return result as Subscription;
  }

  /**
   * Update subscription by user ID
   */
  async updateByUserId(
    supabase: SupabaseClient,
    userId: string,
    data: SubscriptionUpdate
  ): Promise<Subscription> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as Subscription;
  }

  /**
   * Update subscription by provider subscription ID (for webhooks)
   */
  async updateByProviderSubscriptionId(
    supabase: SupabaseClient,
    providerSubscriptionId: string,
    data: SubscriptionUpdate
  ): Promise<Subscription> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("provider_subscription_id", providerSubscriptionId)
      .select()
      .single();

    if (error) throw error;
    return updated as Subscription;
  }

  /**
   * Check if user has an active subscription
   * Active statuses: active, trialing, past_due, cancelled (until period end)
   */
  async isSubscribed(
    supabase: SupabaseClient,
    userId: string
  ): Promise<boolean> {
    const activeStatuses: SubscriptionStatus[] = [
      "active",
      "trialing",
      "past_due",
      "cancelled", // Still active until period end
    ];

    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", activeStatuses);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  /**
   * Check if user has access (subscription active and period not ended)
   */
  async hasActiveAccess(
    supabase: SupabaseClient,
    userId: string
  ): Promise<boolean> {
    const subscription = await this.getByUserId(supabase, userId);

    if (!subscription) return false;

    const activeStatuses: SubscriptionStatus[] = [
      "active",
      "trialing",
      "past_due",
      "cancelled",
    ];

    if (!activeStatuses.includes(subscription.status)) {
      return false;
    }

    // Check if period has ended
    const periodEnd = new Date(subscription.current_period_end);
    return periodEnd > new Date();
  }

  /**
   * Get subscriptions that have expired (for cleanup job)
   */
  async getExpiredSubscriptions(
    supabase: SupabaseClient
  ): Promise<Subscription[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("status", "cancelled")
      .lt("current_period_end", now);

    if (error) throw error;
    return (data ?? []) as Subscription[];
  }

  /**
   * Delete subscription
   */
  async delete(
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
  }
}

// Export singleton instance
export const subscriptionRepository = new SubscriptionRepository();
