"use client";

import { formatCurrency } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import type { CategoryTotal } from "@/lib/insights/types";

interface CategoryBreakdownProps {
  categories: CategoryTotal[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">
            By Category
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-sm text-neutral-400">
            Categorize expenses to see breakdown
          </p>
        </div>
      </div>
    );
  }

  const maxAmount = categories[0]?.amount ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">By Category</h3>
      </div>
      <div className="p-4 space-y-3">
        {categories.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-neutral-700 truncate">
                  {cat.category}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-medium text-neutral-800 tabular-nums">
                  {formatCurrency(cat.amount, CURRENCY)}
                </span>
                <span className="text-xs text-neutral-400 tabular-nums w-8 text-right">
                  {cat.percentage}%
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
