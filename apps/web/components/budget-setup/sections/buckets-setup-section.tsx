"use client";

import { useState } from "react";
import { PiggyBank, Wallet, Gift, Settings2, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardBucket } from "@/lib/budget-setup";
import { DEFAULT_BUCKETS } from "@/lib/budget-setup";
import { CURRENCY } from "@/lib/constants";

interface BucketsSetupSectionProps {
  buckets: WizardBucket[];
  onBucketsChange: (buckets: WizardBucket[]) => void;
  availableAmount: number;
}

const BUCKET_ICONS: Record<string, typeof PiggyBank> = {
  PiggyBank,
  Wallet,
  Gift,
};

export function BucketsSetupSection({
  buckets,
  onBucketsChange,
  availableAmount,
}: BucketsSetupSectionProps) {
  const [showCustomize, setShowCustomize] = useState(false);

  // Calculate if using defaults
  const isUsingDefaults = buckets.every((bucket) => {
    const defaultBucket = DEFAULT_BUCKETS.find((d) => d.slug === bucket.slug);
    return defaultBucket && defaultBucket.percentage === bucket.percentage;
  });

  // Validate percentages
  const totalPercent = buckets.reduce((sum, b) => sum + b.percentage, 0);
  const isValid = Math.abs(totalPercent - 100) < 0.01;

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

  const resetToDefaults = () => {
    onBucketsChange(
      DEFAULT_BUCKETS.map((b) => ({
        ...b,
        allocatedAmount: Math.floor((availableAmount * b.percentage) / 100),
      }))
    );
    setShowCustomize(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-stone-900">Budget Buckets</h2>
          <p className="text-sm text-stone-500">How to split your remaining money</p>
        </div>
        {isValid && (
          <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-violet-600" />
          </div>
        )}
      </div>

      {/* Available Amount */}
      <div className="mb-4 p-3 bg-violet-50 rounded-xl">
        <p className="text-sm text-violet-600">
          Available to budget: <span className="font-semibold">{CURRENCY}{Math.round(availableAmount).toLocaleString()}/month</span>
        </p>
      </div>

      {/* Allocation Bar */}
      <div className="mb-4">
        <div className="flex h-8 overflow-hidden rounded-lg">
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              style={{
                width: `${bucket.percentage}%`,
                backgroundColor: bucket.color,
              }}
              className="flex items-center justify-center text-xs font-medium text-white transition-all"
            >
              {bucket.percentage >= 15 && `${bucket.percentage}%`}
            </div>
          ))}
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
      </div>

      {/* Buckets Display */}
      <div className="space-y-3 mb-4">
        {buckets.map((bucket) => {
          const Icon = BUCKET_ICONS[bucket.icon] || Wallet;
          const allocatedAmount = Math.floor((availableAmount * bucket.percentage) / 100);

          return (
            <div
              key={bucket.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${bucket.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: bucket.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-800">{bucket.name}</p>
                  {bucket.isDefault && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  {CURRENCY}{allocatedAmount.toLocaleString()}/month
                </p>
              </div>
              {showCustomize ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bucket.percentage}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                      updateBucketPercentage(bucket.id, val);
                    }}
                    className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-center text-sm font-medium text-stone-800 focus:border-violet-500 focus:outline-none"
                  />
                  <span className="text-sm text-stone-500">%</span>
                </div>
              ) : (
                <span className="font-semibold text-stone-800">{bucket.percentage}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sliders (when customizing) */}
      {showCustomize && (
        <div className="space-y-4 mb-4 p-4 bg-stone-50/50 rounded-xl border border-stone-100">
          {buckets.map((bucket) => (
            <div key={bucket.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">{bucket.name}</span>
                <span className="font-medium text-stone-800">{bucket.percentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bucket.percentage}
                onChange={(e) => updateBucketPercentage(bucket.id, parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: bucket.color }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {showCustomize ? (
          <>
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex-1 gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => setShowCustomize(false)}
              disabled={!isValid}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              Done
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowCustomize(true)}
            className="w-full gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Customize Buckets
          </Button>
        )}
      </div>

      {/* Explanation */}
      {!showCustomize && (
        <div className="mt-4 p-3 bg-stone-50 rounded-lg">
          <p className="text-xs text-stone-500 leading-relaxed">
            <span className="font-medium">How it works:</span> Savings is set aside first,
            Daily Spending is your everyday budget, and Flex is for treats and extras.
          </p>
        </div>
      )}
    </div>
  );
}
