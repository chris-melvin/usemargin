import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RoadmapItem,
  RoadmapItemInsert,
  RoadmapItemUpdate,
  RoadmapStatus,
} from "@repo/database";

/**
 * Repository for roadmap operations
 * Note: RoadmapItem doesn't have user_id, so we don't extend BaseRepository
 */
class RoadmapRepository {
  protected tableName = "roadmap_items";

  /**
   * Find a roadmap item by ID
   */
  async findById(
    supabase: SupabaseClient,
    id: string
  ): Promise<RoadmapItem | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as RoadmapItem;
  }

  /**
   * Find all public roadmap items
   */
  async findPublic(supabase: SupabaseClient): Promise<RoadmapItem[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("is_public", true)
      .order("status", { ascending: true })
      .order("vote_count", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as RoadmapItem[];
  }

  /**
   * Find roadmap items by status
   */
  async findByStatus(
    supabase: SupabaseClient,
    status: RoadmapStatus,
    publicOnly: boolean = true
  ): Promise<RoadmapItem[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("status", status)
      .order("vote_count", { ascending: false })
      .order("sort_order", { ascending: true });

    if (publicOnly) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as RoadmapItem[];
  }

  /**
   * Find all roadmap items (admin use)
   */
  async findAll(
    supabase: SupabaseClient,
    options?: { status?: RoadmapStatus; includePrivate?: boolean }
  ): Promise<RoadmapItem[]> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (!options?.includePrivate) {
      query = query.eq("is_public", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as RoadmapItem[];
  }

  /**
   * Create a new roadmap item (admin use)
   */
  async create(
    supabase: SupabaseClient,
    data: RoadmapItemInsert
  ): Promise<RoadmapItem> {
    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created as RoadmapItem;
  }

  /**
   * Update a roadmap item (admin use)
   */
  async update(
    supabase: SupabaseClient,
    id: string,
    data: RoadmapItemUpdate
  ): Promise<RoadmapItem> {
    const { data: updated, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated as RoadmapItem;
  }

  /**
   * Delete a roadmap item (admin use)
   */
  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);

    if (error) throw error;
  }

  /**
   * Update status (admin use)
   */
  async updateStatus(
    supabase: SupabaseClient,
    id: string,
    status: RoadmapStatus
  ): Promise<RoadmapItem> {
    const updateData: RoadmapItemUpdate = { status };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    return this.update(supabase, id, updateData);
  }

  /**
   * Get items grouped by status for board view
   */
  async getGroupedByStatus(
    supabase: SupabaseClient,
    publicOnly: boolean = true
  ): Promise<Record<RoadmapStatus, RoadmapItem[]>> {
    const items = await this.findAll(supabase, {
      includePrivate: !publicOnly,
    });

    const grouped: Record<RoadmapStatus, RoadmapItem[]> = {
      under_consideration: [],
      planned: [],
      in_progress: [],
      completed: [],
    };

    for (const item of items) {
      grouped[item.status].push(item);
    }

    // Sort each group by vote count
    for (const status of Object.keys(grouped) as RoadmapStatus[]) {
      grouped[status].sort((a, b) => b.vote_count - a.vote_count);
    }

    return grouped;
  }

  /**
   * Reorder items within a status column
   */
  async reorder(
    supabase: SupabaseClient,
    items: { id: string; sort_order: number }[]
  ): Promise<void> {
    for (const item of items) {
      await supabase
        .from(this.tableName)
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
    }
  }
}

// Export singleton instance
export const roadmapRepository = new RoadmapRepository();
