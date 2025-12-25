import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Base repository with common CRUD operations
 * All repositories extend this class to inherit standard methods
 */
export abstract class BaseRepository<
  T extends { id: string },
  TInsert,
  TUpdate,
> {
  protected abstract tableName: string;

  /**
   * Find a single record by ID
   */
  async findById(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as T;
  }

  /**
   * Find all records for a user
   */
  async findAll(
    supabase: SupabaseClient,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: keyof T;
      ascending?: boolean;
    }
  ): Promise<T[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    if (options?.orderBy) {
      query = query.order(options.orderBy as string, {
        ascending: options.ascending ?? false,
      });
    } else {
      query = query.order("created_at", { ascending: false });
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
    return (data ?? []) as T[];
  }

  /**
   * Create a new record
   */
  async create(supabase: SupabaseClient, data: TInsert): Promise<T> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as object)
      .select()
      .single();

    if (error) throw error;
    return created as T;
  }

  /**
   * Create multiple records
   */
  async createMany(supabase: SupabaseClient, data: TInsert[]): Promise<T[]> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data as object[])
      .select();

    if (error) throw error;
    return (created ?? []) as T[];
  }

  /**
   * Update a record
   */
  async update(
    supabase: SupabaseClient,
    id: string,
    userId: string,
    data: TUpdate
  ): Promise<T> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data as object)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated as T;
  }

  /**
   * Delete a record
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
   * Delete multiple records
   */
  async deleteMany(
    supabase: SupabaseClient,
    ids: string[],
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .in("id", ids)
      .eq("user_id", userId);

    if (error) throw error;
  }

  /**
   * Check if a record exists
   */
  async exists(
    supabase: SupabaseClient,
    id: string,
    userId: string
  ): Promise<boolean> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  /**
   * Count records for a user
   */
  async count(supabase: SupabaseClient, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) throw error;
    return count ?? 0;
  }
}
