import { z } from "zod";

// Enums
const feedbackTypeEnum = z.enum(["bug", "feature", "improvement", "other"]);
const feedbackStatusEnum = z.enum([
  "new",
  "reviewed",
  "accepted",
  "rejected",
  "converted",
]);
const roadmapStatusEnum = z.enum([
  "under_consideration",
  "planned",
  "in_progress",
  "completed",
]);

/**
 * Schema for submitting feedback
 */
export const submitFeedbackSchema = z.object({
  type: feedbackTypeEnum,
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less"),
  user_email: z.string().email("Invalid email address").optional().nullable(),
});

/**
 * Schema for updating feedback status (admin)
 */
export const updateFeedbackStatusSchema = z.object({
  id: z.string().uuid("Invalid feedback ID"),
  status: feedbackStatusEnum,
  roadmap_item_id: z.string().uuid("Invalid roadmap item ID").optional(),
});

/**
 * Schema for creating a roadmap item (admin)
 */
export const createRoadmapItemSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less"),
  status: roadmapStatusEnum.default("under_consideration"),
  category: z.string().max(100).optional().nullable(),
  is_public: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

/**
 * Schema for updating a roadmap item (admin)
 */
export const updateRoadmapItemSchema = createRoadmapItemSchema.partial().extend({
  completed_at: z.string().datetime().optional().nullable(),
});

/**
 * Schema for converting feedback to roadmap item (admin)
 */
export const convertFeedbackToRoadmapSchema = z.object({
  feedback_id: z.string().uuid("Invalid feedback ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or less"),
  status: roadmapStatusEnum.default("under_consideration"),
  category: z.string().max(100).optional().nullable(),
});

/**
 * Schema for toggling vote on roadmap item
 */
export const toggleVoteSchema = z.object({
  roadmap_item_id: z.string().uuid("Invalid roadmap item ID"),
});

/**
 * Schema for querying feedback (admin)
 */
export const feedbackQuerySchema = z.object({
  status: feedbackStatusEnum.optional(),
  type: feedbackTypeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Export inferred types
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type UpdateFeedbackStatusInput = z.infer<
  typeof updateFeedbackStatusSchema
>;
export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>;
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>;
export type ConvertFeedbackToRoadmapInput = z.infer<
  typeof convertFeedbackToRoadmapSchema
>;
export type ToggleVoteInput = z.infer<typeof toggleVoteSchema>;
export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;
export type FeedbackType = z.infer<typeof feedbackTypeEnum>;
export type FeedbackStatus = z.infer<typeof feedbackStatusEnum>;
export type RoadmapStatus = z.infer<typeof roadmapStatusEnum>;
