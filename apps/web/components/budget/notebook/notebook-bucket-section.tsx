"use client";

import { useState } from "react";
import { PiggyBank, Star, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotebookSection, NotebookSectionContent, NotebookSectionDivider } from "./notebook-section";
import { NotebookSectionHeader } from "./notebook-section-header";
import { NotebookEmptyRow } from "./notebook-row";
import { BucketForm } from "../bucket-form";
import { createBucket, updateBucket, deleteBucket, setDefaultBucket } from "@/actions/buckets";
import { cn } from "@/lib/utils";
import type { BudgetBucket } from "@repo/database";

// Icon map for buckets
const ICON_MAP: Record<string, string> = {
  Wallet: "💳",
  PiggyBank: "🐷",
  ShoppingCart: "🛒",
  Gamepad2: "🎮",
  Car: "🚗",
  Plane: "✈️",
  Gift: "🎁",
  Heart: "❤️",
  GraduationCap: "🎓",
  Home: "🏠",
  Utensils: "🍴",
  Film: "🎬",
  Music: "🎵",
  Dumbbell: "💪",
  Stethoscope: "🩺",
};

interface NotebookBucketSectionProps {
  buckets: BudgetBucket[];
  currency: string;
  totalIncome: number;
  availableAmount: number;
  onBucketsChange?: () => void;
}

export function NotebookBucketSection({
  buckets,
  currency,
  totalIncome,
  availableAmount,
  onBucketsChange,
}: NotebookBucketSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<BudgetBucket | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Calculate totals - fixed amounts first, then percentage of remaining
  const totalFixedAmount = buckets.reduce((sum, b) => sum + (b.target_amount ?? 0), 0);
  const totalPercent = buckets.reduce((sum, b) => sum + (b.percentage ?? 0), 0);
  const totalAllocated = buckets.reduce((sum, b) => {
    if (b.target_amount && b.target_amount > 0) return sum + b.target_amount;
    return sum + Math.floor((availableAmount * (b.percentage ?? 0)) / 100);
  }, 0);

  const handleAdd = async (data: {
    name: string;
    slug: string;
    percentage: number | null;
    targetAmount: number | null;
    color: string;
    icon: string;
    isDefault: boolean;
  }) => {
    setIsPending(true);
    try {
      await createBucket(data);
      toast.success("Bucket created");
      setIsFormOpen(false);
      onBucketsChange?.();
    } catch (error) {
      toast.error("Failed to create bucket");
    } finally {
      setIsPending(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    slug: string;
    percentage: number | null;
    targetAmount: number | null;
    color: string;
    icon: string;
    isDefault: boolean;
  }) => {
    if (!editingBucket) return;
    setIsPending(true);
    try {
      await updateBucket(editingBucket.id, {
        name: data.name,
        percentage: data.percentage,
        targetAmount: data.targetAmount,
        color: data.color,
        icon: data.icon,
      });
      toast.success("Bucket updated");
      setEditingBucket(null);
      onBucketsChange?.();
    } catch (error) {
      toast.error("Failed to update bucket");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const bucket = buckets.find((b) => b.id === deleteId);
    if (bucket?.is_default) {
      toast.error("Cannot delete the default bucket");
      setDeleteId(null);
      return;
    }
    setIsPending(true);
    try {
      await deleteBucket(deleteId);
      toast.success("Bucket deleted");
      setDeleteId(null);
      onBucketsChange?.();
    } catch (error) {
      toast.error("Failed to delete bucket");
    } finally {
      setIsPending(false);
    }
  };

  const handleSetDefault = async (bucketId: string) => {
    setIsPending(true);
    try {
      await setDefaultBucket(bucketId);
      toast.success("Default bucket updated");
      onBucketsChange?.();
    } catch (error) {
      toast.error("Failed to set default");
    } finally {
      setIsPending(false);
    }
  };

  // Calculate bar widths based on allocated amounts as percentage of total income
  const getBarWidth = (bucket: BudgetBucket) => {
    if (totalIncome <= 0) return 0;
    const allocated = bucket.target_amount && bucket.target_amount > 0
      ? bucket.target_amount
      : Math.floor((availableAmount * (bucket.percentage ?? 0)) / 100);
    return Math.min((allocated / totalIncome) * 100, 100);
  };

  const totalBarWidth = totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0;

  return (
    <>
      <NotebookSectionDivider />
      <NotebookSection>
        <NotebookSectionHeader
          title="Buckets"
          icon={<PiggyBank className="w-4 h-4 text-teal-600" />}
          iconColor="text-teal-600"
          iconBg="bg-teal-100"
          total={totalAllocated}
          currency={currency}
          count={buckets.length}
          onAdd={() => setIsFormOpen(true)}
          marginAnnotation="allocated"
        />
        <NotebookSectionContent>
          {buckets.length === 0 ? (
            <NotebookEmptyRow
              message="No spending buckets"
              actionLabel="Add bucket"
              onAction={() => setIsFormOpen(true)}
            />
          ) : (
            <>
              {/* Allocation bar - shows amounts as portion of total income */}
              <div className="px-4 py-2 border-b border-stone-100">
                <div className="flex h-3 overflow-hidden rounded-full bg-stone-100">
                  {buckets.map((bucket) => (
                    <div
                      key={bucket.id}
                      style={{
                        width: `${getBarWidth(bucket)}%`,
                        backgroundColor: bucket.color ?? "#6b7280",
                      }}
                      className="transition-all duration-300"
                      title={`${bucket.name}: ${currency}${(bucket.target_amount ?? Math.floor((availableAmount * (bucket.percentage ?? 0)) / 100)).toLocaleString()}`}
                    />
                  ))}
                  {totalBarWidth < 100 && (
                    <div
                      style={{ width: `${100 - totalBarWidth}%` }}
                      className="bg-stone-200"
                      title={`Unallocated: ${currency}${(totalIncome - totalAllocated).toLocaleString()}`}
                    />
                  )}
                </div>
                <p className="text-[10px] text-stone-400 mt-1 text-right">
                  {currency}{totalAllocated.toLocaleString()} of {currency}{totalIncome.toLocaleString()} allocated
                </p>
              </div>

              {/* Bucket rows */}
              {buckets.map((bucket) => {
                const isFixed = bucket.target_amount && bucket.target_amount > 0;
                const allocated = isFixed
                  ? bucket.target_amount!
                  : Math.floor((availableAmount * (bucket.percentage ?? 0)) / 100);
                const icon = ICON_MAP[bucket.icon ?? "Wallet"] ?? "💳";

                return (
                  <div
                    key={bucket.id}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0",
                      "hover:bg-stone-50/50 transition-colors",
                      isPending && "opacity-50"
                    )}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: bucket.color ?? "#6b7280" }}
                    />

                    {/* Icon */}
                    <span className="text-lg flex-shrink-0">{icon}</span>

                    {/* Name and allocation type */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-800 truncate">
                          {bucket.name}
                        </span>
                        {bucket.is_default && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400">
                        {isFixed ? "Fixed amount" : `${bucket.percentage ?? 0}% of remaining`}
                      </span>
                    </div>

                    {/* Amount */}
                    <span className="font-mono text-sm font-medium text-stone-700 tabular-nums">
                      {currency}{allocated.toLocaleString()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSetDefault(bucket.id)}
                        disabled={bucket.is_default || isPending}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          bucket.is_default
                            ? "text-amber-500 bg-amber-50"
                            : "text-stone-400 hover:text-amber-500 hover:bg-amber-50"
                        )}
                        title={bucket.is_default ? "Default bucket" : "Set as default"}
                      >
                        <Star className="w-3.5 h-3.5" fill={bucket.is_default ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => setEditingBucket(bucket)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(bucket.id)}
                        disabled={bucket.is_default || isPending}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          bucket.is_default
                            ? "text-stone-300 cursor-not-allowed"
                            : "text-stone-400 hover:text-rose-500 hover:bg-rose-50"
                        )}
                        title={bucket.is_default ? "Cannot delete default" : "Delete"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </NotebookSectionContent>
      </NotebookSection>

      {/* Add Form */}
      <BucketForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        existingSlugs={buckets.map((b) => b.slug)}
        currency={currency}
        onSave={handleAdd}
      />

      {/* Edit Form */}
      <BucketForm
        open={!!editingBucket}
        onClose={() => setEditingBucket(null)}
        bucket={editingBucket ?? undefined}
        existingSlugs={buckets.filter((b) => b.id !== editingBucket?.id).map((b) => b.slug)}
        currency={currency}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bucket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bucket? Expenses assigned to this bucket will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
