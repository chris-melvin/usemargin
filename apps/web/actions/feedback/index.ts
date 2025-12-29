"use server";

import { revalidatePath } from "next/cache";
import {
  submitFeedbackSchema,
  updateFeedbackStatusSchema,
  feedbackQuerySchema,
  convertFeedbackToRoadmapSchema,
} from "@/lib/validations";
import { feedbackRepository, roadmapRepository } from "@/lib/repositories";
import { requireAuth } from "@/lib/action-utils";
import { createClient } from "@/lib/supabase/server";
import { type ActionResult, error, success } from "@/lib/errors";
import type { Feedback, FeedbackStatus, FeedbackType } from "@repo/database";

/**
 * Submit feedback (requires auth)
 */
export async function submitFeedback(data: {
  type: FeedbackType;
  title: string;
  description: string;
  user_email?: string | null;
}): Promise<ActionResult<Feedback>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  const validation = submitFeedbackSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  try {
    const feedback = await feedbackRepository.create(supabase, {
      user_id: userId,
      type: validation.data.type,
      title: validation.data.title,
      description: validation.data.description,
      user_email: validation.data.user_email ?? null,
    });

    return success(feedback);
  } catch (err) {
    console.error("Failed to submit feedback:", err);
    return error("Failed to submit feedback", "DATABASE_ERROR");
  }
}

/**
 * Get all feedback for the current user
 */
export async function getUserFeedback(): Promise<ActionResult<Feedback[]>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;
  const { userId, supabase } = authResult.data;

  try {
    const feedback = await feedbackRepository.findAll(supabase, userId);
    return success(feedback);
  } catch (err) {
    console.error("Failed to get feedback:", err);
    return error("Failed to get feedback", "DATABASE_ERROR");
  }
}

// =============================================================================
// ADMIN ACTIONS
// =============================================================================

/**
 * Get all feedback (admin only)
 * Uses service role to bypass RLS
 */
export async function getAllFeedback(query?: {
  status?: FeedbackStatus;
  type?: FeedbackType;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ feedback: Feedback[]; total: number }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  // TODO: Add admin check here
  // For now, we'll allow any authenticated user to access admin functions

  const supabase = await createClient();

  const validation = feedbackQuerySchema.safeParse(query ?? {});
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid query",
      "VALIDATION_ERROR"
    );
  }

  try {
    const feedback = await feedbackRepository.findAllFeedback(supabase, {
      status: validation.data.status,
      type: validation.data.type,
      limit: validation.data.limit,
      offset: validation.data.offset,
    });

    // Get total count for pagination
    let totalCount = feedback.length;
    if (validation.data.status) {
      totalCount = await feedbackRepository.countByStatus(
        supabase,
        validation.data.status
      );
    }

    return success({ feedback, total: totalCount });
  } catch (err) {
    console.error("Failed to get all feedback:", err);
    return error("Failed to get feedback", "DATABASE_ERROR");
  }
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatus(data: {
  id: string;
  status: FeedbackStatus;
  roadmap_item_id?: string;
}): Promise<ActionResult<Feedback>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const validation = updateFeedbackStatusSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  try {
    const feedback = await feedbackRepository.updateStatus(
      supabase,
      validation.data.id,
      validation.data.status,
      validation.data.roadmap_item_id
    );

    revalidatePath("/admin/feedback");

    return success(feedback);
  } catch (err) {
    console.error("Failed to update feedback status:", err);
    return error("Failed to update feedback status", "DATABASE_ERROR");
  }
}

/**
 * Convert feedback to roadmap item (admin only)
 */
export async function convertFeedbackToRoadmap(data: {
  feedback_id: string;
  title: string;
  description: string;
  status?: "under_consideration" | "planned" | "in_progress" | "completed";
  category?: string | null;
}): Promise<ActionResult<{ feedback: Feedback; roadmapItem: Awaited<ReturnType<typeof roadmapRepository.create>> }>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const validation = convertFeedbackToRoadmapSchema.safeParse(data);
  if (!validation.success) {
    return error(
      validation.error.issues[0]?.message ?? "Invalid input",
      "VALIDATION_ERROR"
    );
  }

  const supabase = await createClient();

  try {
    // Create roadmap item
    const roadmapItem = await roadmapRepository.create(supabase, {
      title: validation.data.title,
      description: validation.data.description,
      status: validation.data.status ?? "under_consideration",
      category: validation.data.category ?? null,
    });

    // Update feedback status to converted and link to roadmap item
    const feedback = await feedbackRepository.updateStatus(
      supabase,
      validation.data.feedback_id,
      "converted",
      roadmapItem.id
    );

    revalidatePath("/admin/feedback");
    revalidatePath("/admin/roadmap");
    revalidatePath("/roadmap");

    return success({ feedback, roadmapItem });
  } catch (err) {
    console.error("Failed to convert feedback to roadmap:", err);
    return error("Failed to convert feedback", "DATABASE_ERROR");
  }
}

/**
 * Delete feedback (admin only)
 */
export async function deleteFeedback(id: string): Promise<ActionResult<void>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    await feedbackRepository.deleteFeedback(supabase, id);

    revalidatePath("/admin/feedback");

    return success(undefined);
  } catch (err) {
    console.error("Failed to delete feedback:", err);
    return error("Failed to delete feedback", "DATABASE_ERROR");
  }
}

/**
 * Get feedback counts by status (admin only)
 */
export async function getFeedbackCounts(): Promise<
  ActionResult<Record<FeedbackStatus, number>>
> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const supabase = await createClient();

  try {
    const statuses: FeedbackStatus[] = [
      "new",
      "reviewed",
      "accepted",
      "rejected",
      "converted",
    ];

    const counts: Record<FeedbackStatus, number> = {
      new: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0,
      converted: 0,
    };

    for (const status of statuses) {
      counts[status] = await feedbackRepository.countByStatus(supabase, status);
    }

    return success(counts);
  } catch (err) {
    console.error("Failed to get feedback counts:", err);
    return error("Failed to get feedback counts", "DATABASE_ERROR");
  }
}
