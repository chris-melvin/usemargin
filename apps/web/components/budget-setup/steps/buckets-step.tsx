"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  PiggyBank,
  Wallet,
  Check,
  AlertCircle,
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
import type { WizardBucket } from "@/lib/budget-setup";
import {
  BUCKET_COLORS,
  BUCKET_ICONS,
  validateBucketPercentages,
  generateBucketSlug,
} from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

// Map icon names to components
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

interface BucketsStepProps {
  buckets: WizardBucket[];
  onBucketsChange: (buckets: WizardBucket[]) => void;
  availableAmount: number;
}

export function BucketsStep({
  buckets,
  onBucketsChange,
  availableAmount,
}: BucketsStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const validation = useMemo(
    () => validateBucketPercentages(buckets),
    [buckets]
  );

  const updateBucketPercentage = useCallback(
    (id: string, percentage: number) => {
      onBucketsChange(
        buckets.map((b) =>
          b.id === id
            ? {
                ...b,
                percentage,
                allocatedAmount: Math.floor((availableAmount * percentage) / 100),
              }
            : b
        )
      );
    },
    [buckets, onBucketsChange, availableAmount]
  );

  const addBucket = useCallback(
    (bucket: Omit<WizardBucket, "id" | "allocatedAmount">) => {
      const newBucket: WizardBucket = {
        ...bucket,
        id: crypto.randomUUID(),
        allocatedAmount: Math.floor((availableAmount * (bucket.percentage ?? 0)) / 100),
      };
      onBucketsChange([...buckets, newBucket]);
      setShowAddForm(false);
    },
    [buckets, onBucketsChange, availableAmount]
  );

  const removeBucket = useCallback(
    (id: string) => {
      const bucket = buckets.find((b) => b.id === id);
      if (bucket?.isSystem) return; // Can't delete system buckets
      onBucketsChange(buckets.filter((b) => b.id !== id));
    },
    [buckets, onBucketsChange]
  );

  return (
    <div className="space-y-6">
      {/* Info text */}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-stone-600">
              Allocate your available budget across different buckets.
              Percentages must add up to 100%.
            </p>
            <p className="mt-1 text-lg font-semibold text-stone-800">
              Available: {CURRENCY}
              {Math.round(availableAmount).toLocaleString()}/month
            </p>
          </div>
        </div>
      </div>

      {/* Allocation chart */}
      <div className="space-y-2">
        <div className="flex h-8 overflow-hidden rounded-lg">
          {buckets.map((bucket) => {
            const pct = bucket.percentage ?? 0;
            return (
              <div
                key={bucket.id}
                style={{
                  width: `${pct}%`,
                  backgroundColor: bucket.color,
                }}
                className="flex items-center justify-center text-xs font-medium text-white transition-all"
              >
                {pct >= 10 && `${pct}%`}
              </div>
            );
          })}
          {validation.total < 100 && (
            <div
              style={{ width: `${100 - validation.total}%` }}
              className="flex items-center justify-center bg-stone-200 text-xs font-medium text-stone-500"
            >
              {100 - validation.total >= 10 && `${(100 - validation.total).toFixed(0)}%`}
            </div>
          )}
        </div>

        {/* Validation message */}
        <div
          className={`flex items-center gap-2 text-sm ${
            validation.isValid ? "text-green-600" : "text-amber-600"
          }`}
        >
          {validation.isValid ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {validation.message}
        </div>
      </div>

      {/* Bucket sliders */}
      <div className="space-y-4">
        {buckets.map((bucket) => (
          <BucketSlider
            key={bucket.id}
            bucket={bucket}
            availableAmount={availableAmount}
            onPercentageChange={(percentage) =>
              updateBucketPercentage(bucket.id, percentage)
            }
            onRemove={() => removeBucket(bucket.id)}
          />
        ))}
      </div>

      {/* Add custom bucket */}
      {showAddForm ? (
        <AddBucketForm
          onAdd={addBucket}
          onCancel={() => setShowAddForm(false)}
          existingSlugs={buckets.map((b) => b.slug)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          <Plus className="h-4 w-4" />
          Add Custom Bucket
        </button>
      )}
    </div>
  );
}

function BucketSlider({
  bucket,
  availableAmount,
  onPercentageChange,
  onRemove,
}: {
  bucket: WizardBucket;
  availableAmount: number;
  onPercentageChange: (percentage: number) => void;
  onRemove: () => void;
}) {
  // Get icon component
  const IconComponent = ICON_MAP[bucket.icon] || Wallet;

  const pct = bucket.percentage ?? 0;
  const allocatedAmount = Math.floor((availableAmount * pct) / 100);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${bucket.color}20` }}
          >
            <IconComponent className="h-5 w-5" style={{ color: bucket.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-stone-800">{bucket.name}</h3>
              {bucket.isDefault && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">
              {CURRENCY}
              {allocatedAmount.toLocaleString()}/month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={pct}
              onChange={(e) => {
                const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                onPercentageChange(val);
              }}
              className="w-16 rounded border border-stone-300 px-2 py-1 text-center text-sm font-medium text-stone-800 focus:border-amber-500 focus:outline-none"
            />
            <span className="text-sm text-stone-500">%</span>
          </div>
          {!bucket.isSystem && (
            <button
              onClick={onRemove}
              className="rounded p-1 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={pct}
        onChange={(e) => onPercentageChange(parseInt(e.target.value))}
        className="w-full accent-amber-500"
        style={{
          accentColor: bucket.color,
        }}
      />
    </div>
  );
}

function AddBucketForm({
  onAdd,
  onCancel,
  existingSlugs,
}: {
  onAdd: (bucket: Omit<WizardBucket, "id" | "allocatedAmount">) => void;
  onCancel: () => void;
  existingSlugs: string[];
}) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState(10);
  const [color, setColor] = useState(BUCKET_COLORS[4] ?? "#ec4899"); // pink
  const [icon, setIcon] = useState("Gift");

  const slug = generateBucketSlug(name);
  const slugExists = existingSlugs.includes(slug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || slugExists) return;

    onAdd({
      name: name.trim(),
      slug,
      percentage,
      targetAmount: null,
      color,
      icon,
      isDefault: false,
      isSystem: false,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
    >
      <h3 className="mb-4 font-medium text-stone-800">Add Custom Bucket</h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Bucket Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Entertainment, Travel Fund"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {slugExists && (
            <p className="mt-1 text-sm text-red-500">
              A bucket with this name already exists
            </p>
          )}
        </div>

        {/* Percentage */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Percentage
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="50"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-center font-medium text-stone-800">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {BUCKET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition-transform ${
                  color === c ? "scale-110 ring-2 ring-stone-800 ring-offset-2" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {BUCKET_ICONS.map((iconName) => {
              const IconComp = ICON_MAP[iconName] || Wallet;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                    icon === iconName
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  <IconComp className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || slugExists}
            className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Bucket
          </button>
        </div>
      </div>
    </form>
  );
}
