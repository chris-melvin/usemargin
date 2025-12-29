"use server";

import { revalidatePath } from "next/cache";
import {
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  toggleVoteSchema,
} from "@/lib/validations";
import { roadmapRepository, roadmapVoteRepository } from "@/lib/repositories";
import { requireAuth, getOptionalAuth } from "@/lib/action-utils";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/errors";
import type { RoadmapItem, RoadmapStatus } from "@repo/database";

// =============================================================================
// PUBLIC ACTIONS
// =============================================================================

/**
 * Get all public roadmap items (no auth required)
 */
export async function getPublicRoadmapItems(): Promise<
  ActionResult<RoadmapItem[]>
> {
  const supabase = await createClient();

  try {
    const items = await roadmapRepository.findPublic(supabase);
    return success(items);
  } catch (err) {
    console.error("Failed to get roadmap items:", err);
    return error("Failed to get roadmap items", "DATABASE_ERROR");
  }
}

/**
 * Get roadmap items grouped by status (no auth required for public items)
 */
export async function getRoadmapByStatus(): Promise<
  ActionResult<Record<RoadmapStatus, RoadmapItem[]>>
> {
  const supabase = await createClient();

  try {
    const grouped = await roadmapRepository.getGroupedByStatus(supabase, true);
    return success(grouped);
  } catch (err) {
    console.error("Failed to get roadmap items:", err);
    return error("Failed to get roadmap items", "DATABASE_ERROR");
  }
}

/**
 * Get the current user's voted item IDs (returns empty array if not authenticated)
 */
export async function getUserVotedItems(): Promise<ActionResult<string[]>> {
  const auth = await getOptionalAuth();

  if (!auth) {
    return success([]);
  }

  try {
    const votedIds = await roadmapVoteRepository.getVotedItemIds(
      auth.supabase,
      auth.userId
    );
    return success(votedIds);
  } catch (err) {
    console.error("Failed to get user votes:", err);
    return error("Failed to get user votes", "DATABASE_ERROR");
  }
}

/**
 * Toggle vote on a roadmap item (requires auth)
 */
export async function toggleVote(
  roadmapItemId: string
): Promise<ActionResult<{ voted: boolean; voteCount: number }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = toggleVoteSchema.safeParse({
    roadmap_item_id: roadmapItemId,
  });
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const voted = await roadmapVoteRepository.toggleVote(
      supabase,
      userId,
      roadmapItemId
    );

    // Get updated vote count
    const item = await roadmapRepository.findById(supabase, roadmapItemId);
    const voteCount = item?.vote_count ?? 0;

    revalidatePath("/roadmap");

    return success({ voted, voteCount });
  } catch (err) {
    console.error("Failed to toggle vote:", err);
    return error("Failed to toggle vote", "DATABASE_ERROR");
  }
}

// =============================================================================
// ADMIN ACTIONS
// =============================================================================

/**
 * Get all roadmap items including private (admin only)
 */
export async function getAllRoadmapItems(): Promise<
  ActionResult<RoadmapItem[]>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    const items = await roadmapRepository.findAll(supabase, {
      includePrivate: true,
    });
    return success(items);
  } catch (err) {
    console.error("Failed to get roadmap items:", err);
    return error("Failed to get roadmap items", "DATABASE_ERROR");
  }
}

/**
 * Create a new roadmap item (admin only)
 */
export async function createRoadmapItem(data: {
  title: string;
  description: string;
  status?: RoadmapStatus;
  category?: string | null;
  is_public?: boolean;
  sort_order?: number;
}): Promise<ActionResult<RoadmapItem>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const validation = createRoadmapItemSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  try {
    const item = await roadmapRepository.create(supabase, {
      title: validation.data.title,
      description: validation.data.description,
      status: validation.data.status ?? "under_consideration",
      category: validation.data.category ?? null,
      is_public: validation.data.is_public ?? true,
      sort_order: validation.data.sort_order ?? 0,
    });

    revalidatePath("/roadmap");
    revalidatePath("/admin/roadmap");

    return success(item);
  } catch (err) {
    console.error("Failed to create roadmap item:", err);
    return error("Failed to create roadmap item", "DATABASE_ERROR");
  }
}

/**
 * Update a roadmap item (admin only)
 */
export async function updateRoadmapItem(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: RoadmapStatus;
    category?: string | null;
    is_public?: boolean;
    sort_order?: number;
  }
): Promise<ActionResult<RoadmapItem>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const validation = updateRoadmapItemSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  try {
    const item = await roadmapRepository.update(supabase, id, validation.data);

    revalidatePath("/roadmap");
    revalidatePath("/admin/roadmap");

    return success(item);
  } catch (err) {
    console.error("Failed to update roadmap item:", err);
    return error("Failed to update roadmap item", "DATABASE_ERROR");
  }
}

/**
 * Update roadmap item status (admin only)
 */
export async function updateRoadmapStatus(
  id: string,
  status: RoadmapStatus
): Promise<ActionResult<RoadmapItem>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    const item = await roadmapRepository.updateStatus(supabase, id, status);

    revalidatePath("/roadmap");
    revalidatePath("/admin/roadmap");

    return success(item);
  } catch (err) {
    console.error("Failed to update roadmap status:", err);
    return error("Failed to update roadmap status", "DATABASE_ERROR");
  }
}

/**
 * Delete a roadmap item (admin only)
 */
export async function deleteRoadmapItem(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    await roadmapRepository.delete(supabase, id);

    revalidatePath("/roadmap");
    revalidatePath("/admin/roadmap");

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete roadmap item:", err);
    return error("Failed to delete roadmap item", "DATABASE_ERROR");
  }
}

/**
 * Reorder roadmap items (admin only)
 */
export async function reorderRoadmapItems(
  items: { id: string; sort_order: number }[]
): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    await roadmapRepository.reorder(supabase, items);

    revalidatePath("/roadmap");
    revalidatePath("/admin/roadmap");

    return success(undefined);
  } catch (err) {
    console.error("Failed to reorder roadmap items:", err);
    return error("Failed to reorder roadmap items", "DATABASE_ERROR");
  }
}
