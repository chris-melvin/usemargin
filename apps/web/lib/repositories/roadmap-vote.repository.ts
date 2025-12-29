import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RoadmapVote,
  RoadmapVoteInsert,
  RoadmapVoteUpdate,
} from "@repo/database";
import { BaseRepository } from "./base.repository";

/**
 * Repository for roadmap vote operations
 */
class RoadmapVoteRepository extends BaseRepository<
  RoadmapVote,
  RoadmapVoteInsert,
  RoadmapVoteUpdate
> {
  protected tableName = "roadmap_votes";

  /**
   * Check if a user has voted for a specific item
   */
  async hasVoted(
    supabase: SupabaseClient,
    userId: string,
    roadmapItemId: string
  ): Promise<boolean> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("roadmap_item_id", roadmapItemId);

    if (error) throw error;
    return (count ?? 0) > 0;
  }

  /**
   * Get all votes for a user
   */
  async findByUser(
    supabase: SupabaseClient,
    userId: string
  ): Promise<RoadmapVote[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []) as RoadmapVote[];
  }

  /**
   * Get all item IDs that a user has voted for
   */
  async getVotedItemIds(
    supabase: SupabaseClient,
    userId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("roadmap_item_id")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).map((v) => v.roadmap_item_id);
  }

  /**
   * Toggle vote - add if not voted, remove if voted
   * Returns the new vote state (true = voted, false = unvoted)
   */
  async toggleVote(
    supabase: SupabaseClient,
    userId: string,
    roadmapItemId: string
  ): Promise<boolean> {
    const hasVote = await this.hasVoted(supabase, userId, roadmapItemId);

    if (hasVote) {
      // Remove vote
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq("user_id", userId)
        .eq("roadmap_item_id", roadmapItemId);

      if (error) throw error;
      return false;
    } else {
      // Add vote
      const { error } = await supabase.from(this.tableName).insert({
        user_id: userId,
        roadmap_item_id: roadmapItemId,
      });

      if (error) throw error;
      return true;
    }
  }

  /**
   * Add a vote
   */
  async addVote(
    supabase: SupabaseClient,
    userId: string,
    roadmapItemId: string
  ): Promise<RoadmapVote> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        user_id: userId,
        roadmap_item_id: roadmapItemId,
      })
      .select()
      .single();

    if (error) throw error;
    return data as RoadmapVote;
  }

  /**
   * Remove a vote
   */
  async removeVote(
    supabase: SupabaseClient,
    userId: string,
    roadmapItemId: string
  ): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("user_id", userId)
      .eq("roadmap_item_id", roadmapItemId);

    if (error) throw error;
  }

  /**
   * Get vote count for an item
   */
  async getVoteCount(
    supabase: SupabaseClient,
    roadmapItemId: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact", head: true })
      .eq("roadmap_item_id", roadmapItemId);

    if (error) throw error;
    return count ?? 0;
  }
}

// Export singleton instance
export const roadmapVoteRepository = new RoadmapVoteRepository();
