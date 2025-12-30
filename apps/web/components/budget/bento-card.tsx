"use client";

import { Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface BentoCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  total?: number;
  currency?: string;
  count?: number;
  onAdd?: () => void;
  onViewAll?: () => void;
  showViewAll?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function BentoCard({
  title,
  icon: Icon,
  iconColor,
  iconBg,
  total,
  currency = "₱",
  count,
  onAdd,
  onViewAll,
  showViewAll = false,
  className,
  children,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative h-full bg-white rounded-2xl border border-stone-200 overflow-hidden",
        "hover:border-amber-200 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {/* Paper texture overlay */}
      <div className="absolute inset-0 bg-paper-texture opacity-5 pointer-events-none" />

      <div className="relative h-full flex flex-col p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-xl",
                iconBg,
                iconColor
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-stone-900 text-sm">{title}</h3>
                {count !== undefined && count > 0 && (
                  <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              {total !== undefined && (
                <p className="text-xs text-stone-500 tabular-nums">
                  {formatCurrency(total, currency)}
                </p>
              )}
            </div>
          </div>

          {onAdd && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="h-8 w-8 p-0 text-stone-400 hover:text-amber-600 hover:bg-amber-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>

        {/* View All Footer */}
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition-colors w-full"
          >
            View all
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// Empty state for cards with no items
export function BentoCardEmpty({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <p className="text-xs text-stone-400 mb-2">{message}</p>
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAction}
          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <Plus className="w-3 h-3 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
