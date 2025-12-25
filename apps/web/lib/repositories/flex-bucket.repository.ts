import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FlexBucket,
  FlexBucketInsert,
  FlexBucketUpdate,
  FlexAllocation,
  FlexAllocationInsert,
  FlexAllocationUpdate,
  DailyOverride,
  DailyOverrideInsert,
  DailyOverrideUpdate,
} from "@repo/database";

/**
 * Repository for flex bucket operations
 * Each user has exactly one flex bucket
 */
class FlexBucketRepository {
  private tableName = "flex_bucket";

  /**
   * Get or create flex bucket for a user
   */
  async getOrCreate(
    supabase: SupabaseClient,
    userId: string
  ): Promise<FlexBucket> {
    // Try to get existing
    const { data: existing, error: fetchError } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing && !fetchError) {
      return existing as FlexBucket;
    }

    // Create if not found
    if (fetchError?.code === "PGRST116") {
      const { data: created, error: createError } = await supabase
        .from(this.tableName)
        .insert({ user_id: userId, balance: 0 } as FlexBucketInsert)
        .select()
        .single();

      if (createError) throw createError;
      return created as FlexBucket;
    }

    throw fetchError;
  }

  /**
   * Update flex bucket balance
   */
  async updateBalance(
    supabase: SupabaseClient,
    userId: string,
    balance: number
  ): Promise<FlexBucket> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ balance } as FlexBucketUpdate)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as FlexBucket;
  }

  /**
   * Add to flex bucket balance
   */
  async addToBalance(
    supabase: SupabaseClient,
    userId: string,
    amount: number
  ): Promise<FlexBucket> {
    const current = await this.getOrCreate(supabase, userId);
    return this.updateBalance(supabase, userId, current.balance + amount);
  }

  /**
   * Subtract from flex bucket balance
   */
  async subtractFromBalance(
    supabase: SupabaseClient,
    userId: string,
    amount: number
  ): Promise<FlexBucket> {
    const current = await this.getOrCreate(supabase, userId);
    return this.updateBalance(supabase, userId, current.balance - amount);
  }
}

/**
 * Repository for flex allocation operations
 */
class FlexAllocationRepository {
  private tableName = "flex_allocations";

  /**
   * Find all allocations for a user
   */
  async findAll(
    supabase: SupabaseClient,
    userId: string
  ): Promise<FlexAllocation[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as FlexAllocation[];
  }

  /**
   * Find allocations for a date range
   */
  async findByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<FlexAllocation[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as FlexAllocation[];
  }

  /**
   * Get allocation for a specific date
   */
  async findByDate(
    supabase: SupabaseClient,
    userId: string,
    date: string
  ): Promise<FlexAllocation | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as FlexAllocation;
  }

  /**
   * Get total allocation for a date
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
    return (data ?? []).reduce((sum, a) => sum + Number(a.amount), 0);
  }

  /**
   * Create a new allocation
   */
  async create(
    supabase: SupabaseClient,
    data: FlexAllocationInsert
  ): Promise<FlexAllocation> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as FlexAllocation;
  }

  /**
   * Update an allocation
   */
  async update(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    data: FlexAllocationUpdate
  ): Promise<FlexAllocation> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as FlexAllocation;
  }

  /**
   * Delete an allocation
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
}

/**
 * Repository for daily override operations
 */
class DailyOverrideRepository {
  private tableName = "daily_overrides";

  /**
   * Find all overrides for a user
   */
  async findAll(
    supabase: SupabaseClient,
    userId: string
  ): Promise<DailyOverride[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as DailyOverride[];
  }

  /**
   * Find overrides for a date range
   */
  async findByDateRange(
    supabase: SupabaseClient,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyOverride[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) throw error;
    return (data ?? []) as DailyOverride[];
  }

  /**
   * Get override for a specific date
   */
  async findByDate(
    supabase: SupabaseClient,
    userId: string,
    date: string
  ): Promise<DailyOverride | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as DailyOverride;
  }

  /**
   * Create or update override for a date
   */
  async upsert(
    supabase: SupabaseClient,
    userId: string,
    date: string,
    limitAmount: number
  ): Promise<DailyOverride> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(
        {
          user_id: userId,
          date,
          limit_amount: limitAmount,
        } as DailyOverrideInsert,
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) throw error;
    return data as DailyOverride;
  }

  /**
   * Delete override for a date
   */
  async delete(
    supabase: SupabaseClient,
    userId: string,
    date: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("user_id", userId)
      .eq("date", date);

    if (error) throw error;
  }
}

// Export singleton instances
export const flexBucketRepository = new FlexBucketRepository();
export const flexAllocationRepository = new FlexAllocationRepository();
export const dailyOverrideRepository = new DailyOverrideRepository();
