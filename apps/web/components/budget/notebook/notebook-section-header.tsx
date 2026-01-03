"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";

interface NotebookSectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  total: number;
  currency: string;
  count: number;
  onAdd?: () => void;
  marginAnnotation?: string;
}

/**
 * Section header for notebook view
 * Displays section title with icon, count, total, and add button
 */
export function NotebookSectionHeader({
  title,
  icon,
  iconColor,
  iconBg,
  total,
  currency,
  count,
  onAdd,
  marginAnnotation,
}: NotebookSectionHeaderProps) {
  return (
    <div className="relative flex items-center justify-between py-3 mb-2">
      {/* Margin annotation (positioned in the margin area) */}
      {marginAnnotation && (
        <div className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 -rotate-6 hidden sm:block">
          <span className={cn("font-handwriting text-sm", iconColor)}>
            {marginAnnotation}
          </span>
        </div>
      )}

      {/* Section title with icon */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            iconBg
          )}
        >
          {icon}
        </div>
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <span className="text-xs text-neutral-500">{count} items</span>
        </div>
      </div>

      {/* Total and add button */}
      <div className="flex items-center gap-3">
        <span className={cn("font-handwriting text-xl", iconColor)}>
          {formatCurrency(total, currency)}
        </span>
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="h-8 w-8 p-0 hover:bg-neutral-100 rounded-full"
          >
            <Plus className="w-4 h-4 text-neutral-600" />
          </Button>
        )}
      </div>

      {/* Section underline */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neutral-300 via-neutral-200 to-transparent" />
    </div>
  );
}

/**
 * Section subtotal row - displayed at bottom of section
 */
interface NotebookSubtotalProps {
  label?: string;
  amount: number;
  currency: string;
  colorClass?: string;
}

export function NotebookSubtotal({
  label = "Subtotal",
  amount,
  currency,
  colorClass = "text-neutral-700",
}: NotebookSubtotalProps) {
  return (
    <div className="flex justify-between items-center py-2 mt-2 border-t border-neutral-200">
      <span className="font-handwriting text-neutral-500 italic">{label}</span>
      <span className={cn("font-handwriting text-lg tabular-nums underline decoration-double", colorClass)}>
        {formatCurrency(amount, currency)}
      </span>
    </div>
  );
}
