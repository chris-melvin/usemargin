"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUCKET_COLORS, BUCKET_ICONS } from "@/lib/budget-setup";
import { cn } from "@/lib/utils";
import type { BudgetBucket } from "@repo/database";
import {
  Wallet,
  PiggyBank,
  ShoppingCart,
  Gamepad2,
  Car,
  Plane,
  Gift,
  Heart,
  GraduationCap,
  Home,
  Utensils,
  Film,
  Music,
  Dumbbell,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

// Icon map
const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  PiggyBank,
  ShoppingCart,
  Gamepad2,
  Car,
  Plane,
  Gift,
  Heart,
  GraduationCap,
  Home,
  Utensils,
  Film,
  Music,
  Dumbbell,
  Stethoscope,
};

type AllocationMode = "percentage" | "fixed";

interface BucketFormProps {
  open: boolean;
  onClose: () => void;
  bucket?: BudgetBucket;
  existingSlugs: string[];
  currency?: string;
  onSave: (data: {
    name: string;
    slug: string;
    percentage: number | null;
    targetAmount: number | null;
    color: string;
    icon: string;
    isDefault: boolean;
  }) => Promise<void>;
}

export function BucketForm({
  open,
  onClose,
  bucket,
  existingSlugs,
  currency = "₱",
  onSave,
}: BucketFormProps) {
  const isEdit = !!bucket;
  const [name, setName] = useState("");
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("fixed");
  const [percentage, setPercentage] = useState(20);
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [color, setColor] = useState(BUCKET_COLORS[0] ?? "#1A9E9E");
  const [icon, setIcon] = useState("Wallet");
  const [isPending, setIsPending] = useState(false);

  // Reset form when opening/closing or bucket changes
  useEffect(() => {
    if (open) {
      if (bucket) {
        setName(bucket.name);
        setColor(bucket.color ?? BUCKET_COLORS[0] ?? "#1A9E9E");
        setIcon(bucket.icon ?? "Wallet");
        // Determine allocation mode from existing bucket
        if (bucket.target_amount && bucket.target_amount > 0) {
          setAllocationMode("fixed");
          setTargetAmount(bucket.target_amount.toString());
          setPercentage(20);
        } else {
          setAllocationMode("percentage");
          setPercentage(bucket.percentage ?? 20);
          setTargetAmount("");
        }
      } else {
        setName("");
        setAllocationMode("fixed");
        setPercentage(20);
        setTargetAmount("");
        setColor(BUCKET_COLORS[0] ?? "#1A9E9E");
        setIcon("Wallet");
      }
    }
  }, [open, bucket]);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slugExists = !isEdit && existingSlugs.includes(slug);

  const parsedAmount = parseFloat(targetAmount) || 0;
  const isValidAmount = allocationMode === "fixed" ? parsedAmount > 0 : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || slugExists || !isValidAmount) return;

    setIsPending(true);
    try {
      await onSave({
        name: name.trim(),
        slug: isEdit ? bucket.slug : slug,
        percentage: allocationMode === "percentage" ? percentage : null,
        targetAmount: allocationMode === "fixed" ? parsedAmount : null,
        color,
        icon,
        isDefault: false,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Bucket" : "Add Bucket"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this spending bucket"
                : "Create a new spending bucket for your budget"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="bucket-name">Name</Label>
              <Input
                id="bucket-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Savings, Fun Money"
                className="mt-1"
                autoFocus
              />
              {slugExists && (
                <p className="mt-1 text-sm text-red-500">
                  A bucket with this name already exists
                </p>
              )}
            </div>

            {/* Allocation Mode Toggle */}
            <div>
              <Label>Allocation Type</Label>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAllocationMode("fixed")}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    allocationMode === "fixed"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  Fixed Amount
                </button>
                <button
                  type="button"
                  onClick={() => setAllocationMode("percentage")}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    allocationMode === "percentage"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  Percentage
                </button>
              </div>
            </div>

            {/* Fixed Amount Input */}
            {allocationMode === "fixed" && (
              <div>
                <Label htmlFor="target-amount">Amount to Allocate</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                    {currency}
                  </span>
                  <Input
                    id="target-amount"
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000"
                    className="pl-8"
                    min="0"
                    step="100"
                  />
                </div>
                <p className="mt-1 text-xs text-stone-400">
                  This amount will be allocated from your income each month
                </p>
              </div>
            )}

            {/* Percentage Slider */}
            {allocationMode === "percentage" && (
              <div>
                <Label>Percentage of remaining budget</Label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={percentage}
                    onChange={(e) => setPercentage(parseInt(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <span className="w-12 text-center font-medium text-stone-800 tabular-nums">
                    {percentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Color */}
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BUCKET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      color === c
                        ? "scale-110 ring-2 ring-stone-800 ring-offset-2"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {BUCKET_ICONS.map((iconName) => {
                  const IconComp = ICON_MAP[iconName] || Wallet;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                        icon === iconName
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <IconComp className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || slugExists || !isValidAmount || isPending}
            >
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Bucket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
