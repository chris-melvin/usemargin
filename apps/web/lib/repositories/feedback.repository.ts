import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Feedback,
  FeedbackInsert,
  FeedbackUpdate,
  FeedbackStatus,
  FeedbackType,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for feedback operations
 */
class FeedbackRepository extends BaseRepository<
  Feedback,
  FeedbackInsert,
  FeedbackUpdate
> {
  protected tableName = "feedback";

  /**
   * Find feedback by status
   */
  async findByStatus(
    supabase: SupabaseClient,
    status: FeedbackStatus,
    options?: { limit?: number; offset?: number }
  ): Promise<Feedback[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

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
    return (data ?? []) as Feedback[];
  }

  /**
   * Find feedback by type
   */
  async findByType(
    supabase: SupabaseClient,
    type: FeedbackType,
    options?: { limit?: number; offset?: number }
  ): Promise<Feedback[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false });

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
    return (data ?? []) as Feedback[];
  }

  /**
   * Find all feedback (admin use - no user_id filter)
   */
  async findAllFeedback(
    supabase: SupabaseClient,
    options?: {
      limit?: number;
      offset?: number;
      status?: FeedbackStatus;
      type?: FeedbackType;
    }
  ): Promise<Feedback[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.type) {
      query = query.eq("type", options.type);
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
    return (data ?? []) as Feedback[];
  }

  /**
   * Count feedback by status (admin use)
   */
  async countByStatus(
    supabase: SupabaseClient,
    status: FeedbackStatus
  ): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Count feedback by type (admin use)
   */
  async countByType(
    supabase: SupabaseClient,
    type: FeedbackType
  ): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("type", type);

    if (error) throw error;
    return count ?? 0;
  }

  /**
   * Update feedback status (admin use)
   */
  async updateStatus(
    supabase: SupabaseClient,
    id: string,
    status: FeedbackStatus,
    roadmapItemId?: string
  ): Promise<Feedback> {
    const updateData: FeedbackUpdate = { status };
    if (roadmapItemId) {
      updateData.roadmap_item_id = roadmapItemId;
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Feedback;
  }

  /**
   * Find recent feedback (admin use)
   */
  async findRecent(
    supabase: SupabaseClient,
    limit: number = 10
  ): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Feedback[];
  }

  /**
   * Delete feedback (admin use)
   */
  async deleteFeedback(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);

    if (error) throw error;
  }
}

// Export singleton instance
export const feedbackRepository = new FeedbackRepository();
