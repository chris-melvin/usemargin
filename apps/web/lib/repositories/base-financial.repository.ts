import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base.repository";
import * as dateUtils from "@/lib/utils/date";

/**
 * Base repository for financial entities with timestamp-based operations
 *
 * Provides common patterns for querying financial data by date ranges,
 * grouping by dates, and handling timezone-aware operations.
 *
 * @example
 * class ExpenseRepository extends BaseFinancialRepository<Expense, ExpenseInsert, ExpenseUpdate> {
 *   protected tableName = "expenses";
 *   protected timestampColumn = "occurred_at";
 * }
 */
export abstract class BaseFinancialRepository<
  T extends { id: string },
  TInsert,
  TUpdate,
> extends BaseRepository<T, TInsert, TUpdate> {
  /**
   * The name of the timestamp column to use for date range queries
   * Must be overridden by child classes
   */
  protected abstract timestampColumn: string;

  /**
   * Find records within a timestamp range
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param startTimestamp - Start of range (UTC timestamp)
   * @param endTimestamp - End of range (UTC timestamp)
   * @param options - Additional query options
   * @returns Array of records within the timestamp range
   *
   * @example
   * // Get expenses for January 2024 in user's timezone
   * const { start, end } = dateUtils.dateRangeToTimestamps(
   *   "2024-01-01",
   *   "2024-01-31",
   *   userTimezone,
   *   true
   * );
   * const expenses = await expenseRepo.findByTimestampRange(
   *   supabase,
   *   userId,
   *   start,
   *   end
   * );
   */
  async findByTimestampRange(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string,
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
      .eq("user_id", userId)
      .gte(this.timestampColumn, startTimestamp)
      .lte(this.timestampColumn, endTimestamp);

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy as string, {
        ascending: options.ascending ?? false,
      });
    } else {
      query = query.order(this.timestampColumn, { ascending: false });
    }

    // Apply pagination
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
   * Find records for a specific date in the user's timezone
   *
   * Converts the date to a timestamp range (start of day to end of day)
   * in the user's timezone and queries records within that range.
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param date - Date in YYYY-MM-DD format
   * @param timezone - User's timezone
   * @returns Array of records for the specified date
   *
   * @example
   * // Get all expenses for Jan 15, 2024 in New York timezone
   * const expenses = await expenseRepo.findByDateInTimezone(
   *   supabase,
   *   userId,
   *   "2024-01-15",
   *   "America/New_York"
   * );
   */
  async findByDateInTimezone(
    supabase: SupabaseClient,
    userId: string,
    date: string,
    timezone: string
  ): Promise<T[]> {
    // Convert date to timestamp range in user's timezone
    const { start, end } = dateUtils.dateRangeToTimestamps(
      date,
      date,
      timezone,
      true // Include full day
    );

    return this.findByTimestampRange(supabase, userId, start, end);
  }

  /**
   * Get daily totals for a date range
   *
   * Groups records by date (in user's timezone) and sums the amounts.
   * Useful for charts, calendars, and analytics.
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param startTimestamp - Start of range (UTC timestamp)
   * @param endTimestamp - End of range (UTC timestamp)
   * @param timezone - User's timezone for grouping
   * @param amountColumn - Name of the column to sum (defaults to "amount")
   * @returns Array of { date: string, total: number } objects
   *
   * @example
   * // Get daily spending totals for January in user's timezone
   * const { start, end } = dateUtils.dateRangeToTimestamps(
   *   "2024-01-01",
   *   "2024-01-31",
   *   userTimezone,
   *   true
   * );
   * const dailyTotals = await expenseRepo.getDailyTotals(
   *   supabase,
   *   userId,
   *   start,
   *   end,
   *   userTimezone
   * );
   * // Returns: [{ date: "2024-01-01", total: 125.50 }, ...]
   */
  async getDailyTotals(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string,
    timezone: string,
    amountColumn: string = "amount"
  ): Promise<Array<{ date: string; total: number }>> {
    // Get all records in the range
    const records = await this.findByTimestampRange(
      supabase,
      userId,
      startTimestamp,
      endTimestamp
    );

    // Group by date in user's timezone and sum amounts
    const dailyMap = new Map<string, number>();

    for (const record of records) {
      const timestamp = (record as Record<string, unknown>)[this.timestampColumn] as string;
      const date = dateUtils.toDateString(timestamp, timezone);
      const amount = (record as Record<string, unknown>)[amountColumn] as number;

      const currentTotal = dailyMap.get(date) ?? 0;
      dailyMap.set(date, currentTotal + amount);
    }

    // Convert map to sorted array
    return Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Count records within a timestamp range
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param startTimestamp - Start of range (UTC timestamp)
   * @param endTimestamp - End of range (UTC timestamp)
   * @returns Number of records in the range
   */
  async countByTimestampRange(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte(this.timestampColumn, startTimestamp)
      .lte(this.timestampColumn, endTimestamp);

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Find the most recent record for a user
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @returns Most recent record or null
   */
  async findMostRecent(
    supabase: SupabaseClient,
    userId: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order(this.timestampColumn, { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as T;
  }

  /**
   * Find the oldest record for a user
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @returns Oldest record or null
   */
  async findOldest(
    supabase: SupabaseClient,
    userId: string
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .order(this.timestampColumn, { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data as T;
  }

  /**
   * Get sum of amounts within a timestamp range
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param startTimestamp - Start of range (UTC timestamp)
   * @param endTimestamp - End of range (UTC timestamp)
   * @param amountColumn - Name of the column to sum (defaults to "amount")
   * @returns Total amount
   */
  async sumByTimestampRange(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string,
    amountColumn: string = "amount"
  ): Promise<number> {
    const records = await this.findByTimestampRange(
      supabase,
      userId,
      startTimestamp,
      endTimestamp
    );

    return records.reduce((sum, record) => {
      const amount = (record as Record<string, unknown>)[amountColumn] as number;
      return sum + amount;
    }, 0);
  }

  /**
   * Delete records within a timestamp range
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param startTimestamp - Start of range (UTC timestamp)
   * @param endTimestamp - End of range (UTC timestamp)
   */
  async deleteByTimestampRange(
    supabase: SupabaseClient,
    userId: string,
    startTimestamp: string,
    endTimestamp: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("user_id", userId)
      .gte(this.timestampColumn, startTimestamp)
      .lte(this.timestampColumn, endTimestamp);

    if (error) throw error;
  }

  /**
   * Find records before a specific timestamp
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param beforeTimestamp - Timestamp to compare against
   * @param limit - Maximum number of records to return
   * @returns Array of records before the timestamp
   */
  async findBefore(
    supabase: SupabaseClient,
    userId: string,
    beforeTimestamp: string,
    limit?: number
  ): Promise<T[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .lt(this.timestampColumn, beforeTimestamp)
      .order(this.timestampColumn, { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
  }

  /**
   * Find records after a specific timestamp
   *
   * @param supabase - Supabase client
   * @param userId - User ID to filter by
   * @param afterTimestamp - Timestamp to compare against
   * @param limit - Maximum number of records to return
   * @returns Array of records after the timestamp
   */
  async findAfter(
    supabase: SupabaseClient,
    userId: string,
    afterTimestamp: string,
    limit?: number
  ): Promise<T[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .gt(this.timestampColumn, afterTimestamp)
      .order(this.timestampColumn, { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
  }
}
