"use client";

import { useState, useMemo } from "react";
import {
  PiggyBank,
  Wallet,
  Gift,
  Plus,
  Trash2,
  Star,
  Check,
  Info,
  ShoppingCart,
  Gamepad2,
  Car,
  Plane,
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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WizardBucket } from "@/lib/budget-setup";
import { BUCKET_SUGGESTIONS, BUCKET_COLORS, BUCKET_ICONS } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface BucketsSetupSectionProps {
  buckets: WizardBucket[];
  onBucketsChange: (buckets: WizardBucket[]) => void;
  availableAmount: number;
}

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

export function BucketsSetupSection({
  buckets,
  onBucketsChange,
  availableAmount,
}: BucketsSetupSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBucket, setEditingBucket] = useState<string | null>(null);

  // Validate percentages
  const totalPercent = useMemo(
    () => buckets.reduce((sum, b) => sum + (b.percentage ?? 0), 0),
    [buckets]
  );
  const isValid = buckets.length > 0 && Math.abs(totalPercent - 100) < 0.01;
  const hasDefault = buckets.some((b) => b.isDefault);

  // Get suggestions that haven't been added yet
  const availableSuggestions = useMemo(
    () => BUCKET_SUGGESTIONS.filter((s) => !buckets.some((b) => b.slug === s.slug)),
    [buckets]
  );

  const addBucketFromSuggestion = (suggestion: (typeof BUCKET_SUGGESTIONS)[0]) => {
    const isFirstBucket = buckets.length === 0;
    const newBucket: WizardBucket = {
      id: crypto.randomUUID(),
      name: suggestion.name,
      slug: suggestion.slug,
      percentage: suggestion.suggestedPercentage ?? 20,
      targetAmount: null,
      allocatedAmount: Math.floor((availableAmount * (suggestion.suggestedPercentage ?? 20)) / 100),
      color: suggestion.color,
      icon: suggestion.icon,
      description: suggestion.description,
      isDefault: isFirstBucket, // First bucket is default
      isSystem: false,
    };
    onBucketsChange([...buckets, newBucket]);
  };

  const addCustomBucket = (bucket: Omit<WizardBucket, "id" | "allocatedAmount">) => {
    const isFirstBucket = buckets.length === 0;
    const newBucket: WizardBucket = {
      ...bucket,
      id: crypto.randomUUID(),
      allocatedAmount: Math.floor((availableAmount * (bucket.percentage ?? 0)) / 100),
      isDefault: isFirstBucket || bucket.isDefault,
    };

    // If this bucket is default, unset others
    const updatedBuckets = bucket.isDefault
      ? buckets.map((b) => ({ ...b, isDefault: false }))
      : buckets;

    onBucketsChange([...updatedBuckets, newBucket]);
    setShowAddForm(false);
  };

  const updateBucketPercentage = (id: string, percentage: number) => {
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
  };

  const setDefaultBucket = (id: string) => {
    onBucketsChange(
      buckets.map((b) => ({
        ...b,
        isDefault: b.id === id,
      }))
    );
  };

  const removeBucket = (id: string) => {
    let updatedBuckets = buckets.filter((b) => b.id !== id);
    // If we removed the default bucket, make the first remaining bucket default
    if (updatedBuckets.length > 0 && !updatedBuckets.some((b) => b.isDefault)) {
      const first = updatedBuckets[0];
      if (first) {
        updatedBuckets = [{ ...first, isDefault: true }, ...updatedBuckets.slice(1)];
      }
    }
    onBucketsChange(updatedBuckets);
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      {/* Header with tooltip */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-900">Spending Buckets</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-stone-400 hover:text-stone-600">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Divide your remaining money into buckets for different purposes.
                    Think of them like envelopes - each bucket holds money for a specific use.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-stone-500">Allocate your budget into spending categories</p>
        </div>
        {isValid && hasDefault && (
          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-teal-600" />
          </div>
        )}
      </div>

      {/* Available Amount */}
      <div className="mb-4 p-3 bg-teal-50 rounded-xl">
        <p className="text-sm text-teal-700">
          Available to budget:{" "}
          <span className="font-semibold">
            {CURRENCY}
            {Math.round(availableAmount).toLocaleString()}/month
          </span>
        </p>
      </div>

      {/* Empty State */}
      {buckets.length === 0 && (
        <div className="mb-4 p-6 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200 text-center">
          <PiggyBank className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium mb-1">No buckets yet</p>
          <p className="text-sm text-stone-500 mb-4">
            Add buckets to organize your spending. Start with suggestions below or create your own.
          </p>
        </div>
      )}

      {/* Allocation Bar (when buckets exist) */}
      {buckets.length > 0 && (
        <div className="mb-4">
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
                  {pct >= 15 && `${pct}%`}
                </div>
              );
            })}
            {totalPercent < 100 && (
              <div
                style={{ width: `${100 - totalPercent}%` }}
                className="flex items-center justify-center bg-stone-200 text-xs font-medium text-stone-500"
              >
                {100 - totalPercent >= 10 && `${(100 - totalPercent).toFixed(0)}%`}
              </div>
            )}
          </div>
          {!isValid && (
            <p className="text-xs text-amber-600 mt-1">
              {totalPercent < 100
                ? `${(100 - totalPercent).toFixed(0)}% unallocated`
                : `${(totalPercent - 100).toFixed(0)}% over allocated`}
            </p>
          )}
          {!hasDefault && buckets.length > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Click the star to set a default bucket for expenses
            </p>
          )}
        </div>
      )}

      {/* Bucket List */}
      {buckets.length > 0 && (
        <div className="space-y-3 mb-4">
          {buckets.map((bucket) => {
            const Icon = ICON_MAP[bucket.icon] || Wallet;
            const pct = bucket.percentage ?? 0;
            const allocatedAmount = Math.floor((availableAmount * pct) / 100);

            return (
              <div
                key={bucket.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${bucket.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: bucket.color }} />
                </div>

                {/* Name & Amount */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-800 truncate">{bucket.name}</p>
                    {bucket.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    {CURRENCY}
                    {allocatedAmount.toLocaleString()}/month
                  </p>
                </div>

                {/* Percentage input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={pct}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      updateBucketPercentage(bucket.id, val);
                    }}
                    className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-center text-sm font-medium text-stone-800 focus:border-teal-500 focus:outline-none"
                  />
                  <span className="text-sm text-stone-500">%</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setDefaultBucket(bucket.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            bucket.isDefault
                              ? "bg-amber-100 text-amber-600"
                              : "text-stone-400 hover:bg-stone-100 hover:text-amber-500"
                          }`}
                        >
                          <Star className="w-4 h-4" fill={bucket.isDefault ? "currentColor" : "none"} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {bucket.isDefault ? "Default bucket" : "Set as default"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <button
                    onClick={() => removeBucket(bucket.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add Suggestions */}
      {availableSuggestions.length > 0 && !showAddForm && (
        <div className="mb-4">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion.slug}
                onClick={() => addBucketFromSuggestion(suggestion)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {suggestion.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Bucket Form */}
      {showAddForm ? (
        <AddBucketForm
          onAdd={addCustomBucket}
          onCancel={() => setShowAddForm(false)}
          existingSlugs={buckets.map((b) => b.slug)}
          showDefaultOption={buckets.length > 0}
        />
      ) : (
        <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Custom Bucket
        </Button>
      )}

      {/* Explanation */}
      <div className="mt-4 p-3 bg-stone-50 rounded-lg">
        <p className="text-xs text-stone-500 leading-relaxed">
          <span className="font-medium">How it works:</span> The default bucket (marked with a star)
          is where your everyday expenses are tracked. Other buckets help you set aside money for
          specific purposes like savings or fun spending.
        </p>
      </div>
    </div>
  );
}

// Add Bucket Form Component
function AddBucketForm({
  onAdd,
  onCancel,
  existingSlugs,
  showDefaultOption,
}: {
  onAdd: (bucket: Omit<WizardBucket, "id" | "allocatedAmount">) => void;
  onCancel: () => void;
  existingSlugs: string[];
  showDefaultOption: boolean;
}) {
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState(20);
  const [color, setColor] = useState(BUCKET_COLORS[0] ?? "#1A9E9E");
  const [icon, setIcon] = useState("Wallet");
  const [isDefault, setIsDefault] = useState(false);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
      isDefault: !showDefaultOption || isDefault, // First bucket is always default
      isSystem: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-4 space-y-4">
      <h3 className="font-medium text-stone-800">Add Custom Bucket</h3>

      {/* Name */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Entertainment, Travel Fund"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          autoFocus
        />
        {slugExists && <p className="mt-1 text-sm text-red-500">A bucket with this name already exists</p>}
      </div>

      {/* Percentage */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Percentage</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="5"
            max="80"
            value={percentage}
            onChange={(e) => setPercentage(parseInt(e.target.value))}
            className="flex-1 accent-teal-500"
          />
          <span className="w-12 text-center font-medium text-stone-800">{percentage}%</span>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">Color</label>
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
        <label className="mb-2 block text-sm font-medium text-stone-700">Icon</label>
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
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                <IconComp className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Set as Default */}
      {showDefaultOption && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="isDefault" className="text-sm text-stone-700">
            Set as default bucket (where expenses are tracked)
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || slugExists}>
          Add Bucket
        </Button>
      </div>
    </form>
  );
}
