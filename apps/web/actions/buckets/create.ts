"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { budgetBucketRepository } from "@/lib/repositories";
import { DEFAULT_BUCKETS } from "@/lib/budget-setup/constants";
import type { BudgetBucketInsert } from "@repo/database";

interface CreateBucketParams {
  name: string;
  slug?: string;
  percentage?: number;
  allocatedAmount?: number;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

/**
 * Create a single bucket
 */
export async function createBucket(params: CreateBucketParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { name, slug, percentage = 0, allocatedAmount, color, icon, isDefault = false } = params;

  // Generate slug from name if not provided
  const bucketSlug = slug ?? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Check if slug already exists
  const existing = await budgetBucketRepository.findBySlug(supabase, user.id, bucketSlug);
  if (existing) {
    throw new Error(`Bucket with slug "${bucketSlug}" already exists`);
  }

  // Get current bucket count for sort order
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  const sortOrder = existingBuckets.length;

  const bucketInsert: BudgetBucketInsert = {
    user_id: user.id,
    name,
    slug: bucketSlug,
    percentage,
    allocated_amount: allocatedAmount ?? null,
    color: color ?? "#6b7280", // gray-500 default
    icon: icon ?? "Wallet",
    is_default: isDefault,
    is_system: false,
    sort_order: sortOrder,
  };

  const created = await budgetBucketRepository.create(supabase, bucketInsert);

  // If this bucket is set as default, unset others
  if (isDefault) {
    await budgetBucketRepository.setDefault(supabase, user.id, created.id);
  }

  revalidatePath("/");

  return { success: true, bucket: created };
}

/**
 * Create default buckets with flex (for quick setup/testing)
 * Uses the DEFAULT_BUCKETS from constants (includes flex)
 */
export async function createDefaultBucketsWithFlex(totalMonthlyBudget?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user already has buckets
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  if (existingBuckets.length > 0) {
    throw new Error("User already has buckets. Delete existing buckets first or use createBucket.");
  }

  // Calculate allocated amounts if total budget provided
  const budget = totalMonthlyBudget ?? 0;

  const bucketInserts: BudgetBucketInsert[] = DEFAULT_BUCKETS.map((bucket, index) => ({
    user_id: user.id,
    name: bucket.name,
    slug: bucket.slug,
    percentage: bucket.percentage,
    allocated_amount: budget > 0 ? Math.round((budget * bucket.percentage) / 100) : null,
    color: bucket.color,
    icon: bucket.icon,
    is_default: bucket.isDefault,
    is_system: bucket.isSystem,
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from("budget_buckets")
    .insert(bucketInserts)
    .select();

  if (error) {
    console.error("Error creating default buckets:", error);
    throw error;
  }

  revalidatePath("/");

  return { success: true, buckets: data };
}

/**
 * Add a specific bucket by slug (e.g., "flex")
 * Useful for adding a missing bucket without resetting everything
 */
export async function addBucketBySlug(
  slug: "flex" | "savings" | "daily-spending",
  options?: { percentage?: number; allocatedAmount?: number }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Find the bucket definition from defaults
  const definition = DEFAULT_BUCKETS.find((b) => b.slug === slug);
  if (!definition) {
    throw new Error(`Unknown bucket slug: ${slug}`);
  }

  // Check if already exists
  const existing = await budgetBucketRepository.findBySlug(supabase, user.id, slug);
  if (existing) {
    return { success: true, bucket: existing, existed: true };
  }

  // Get sort order
  const existingBuckets = await budgetBucketRepository.findAll(supabase, user.id);
  const sortOrder = existingBuckets.length;

  const bucketInsert: BudgetBucketInsert = {
    user_id: user.id,
    name: definition.name,
    slug: definition.slug,
    percentage: options?.percentage ?? definition.percentage,
    allocated_amount: options?.allocatedAmount ?? null,
    color: definition.color,
    icon: definition.icon,
    is_default: definition.isDefault,
    is_system: definition.isSystem,
    sort_order: sortOrder,
  };

  const created = await budgetBucketRepository.create(supabase, bucketInsert);

  revalidatePath("/");

  return { success: true, bucket: created, existed: false };
}

/**
 * Delete a bucket by ID
 */
export async function deleteBucket(bucketId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await budgetBucketRepository.delete(supabase, bucketId, user.id);

  revalidatePath("/");

  return { success: true };
}

/**
 * Delete all buckets for current user (for testing/reset)
 */
export async function deleteAllBuckets() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("budget_buckets")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting buckets:", error);
    throw error;
  }

  revalidatePath("/");

  return { success: true };
}
