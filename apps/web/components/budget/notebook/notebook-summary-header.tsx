"use client";

import { format } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";

interface NotebookSummaryHeaderProps {
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  currency: string;
}

/**
 * Summary header for notebook view
 * Shows the budget calculation at the top of the notebook
 * Styled like quick calculations jotted at the top of a page
 */
export function NotebookSummaryHeader({
  totalIncome,
  totalExpenses,
  remaining,
  currency,
}: NotebookSummaryHeaderProps) {
  const isPositive = remaining >= 0;

  return (
    <div className="relative bg-amber-50/40 border-b-2 border-amber-200/50 py-4 px-4 mb-6 -mx-4 md:-mx-8">
      {/* Month label (positioned like a header annotation) */}
      <div className="mb-3">
        <span className="font-handwriting text-xl md:text-2xl text-teal-600 -rotate-1 inline-block">
          {format(new Date(), "MMMM yyyy")}
        </span>
      </div>

      {/* Quick calculation area - styled like handwritten math */}
      <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-2">
        {/* Income */}
        <div className="flex items-center gap-1.5">
          <span className="font-handwriting text-sm text-neutral-500">Income:</span>
          <span className="font-handwriting text-lg md:text-xl text-emerald-600">
            +{formatCurrency(totalIncome, currency)}
          </span>
        </div>

        {/* Minus sign */}
        <span className="font-handwriting text-xl md:text-2xl text-neutral-400">-</span>

        {/* Expenses */}
        <div className="flex items-center gap-1.5">
          <span className="font-handwriting text-sm text-neutral-500">Expenses:</span>
          <span className="font-handwriting text-lg md:text-xl text-rose-600">
            {formatCurrency(totalExpenses, currency)}
          </span>
        </div>

        {/* Equals sign */}
        <span className="font-handwriting text-xl md:text-2xl text-neutral-400">=</span>

        {/* Remaining - boxed/highlighted */}
        <div
          className={cn(
            "relative px-3 py-1",
            "border-2 border-dashed rounded-lg",
            isPositive
              ? "border-teal-500 bg-teal-50/50"
              : "border-rose-500 bg-rose-50/50"
          )}
        >
          <span
            className={cn(
              "font-handwriting text-xl md:text-2xl font-bold",
              isPositive ? "text-teal-600" : "text-rose-600"
            )}
          >
            {formatCurrency(Math.abs(remaining), currency)}
          </span>
          <span
            className={cn(
              "absolute -top-2 -right-2",
              "font-handwriting text-[10px]",
              "bg-amber-50 px-1 rounded",
              isPositive ? "text-teal-600" : "text-rose-600"
            )}
          >
            {isPositive ? "left over!" : "over budget"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Running total footer for notebook view
 * Shows all section totals with final calculation
 */
interface NotebookRunningTotalProps {
  sections: Array<{
    label: string;
    total: number;
    colorClass: string;
  }>;
  currency: string;
  grandTotal: number;
}

export function NotebookRunningTotal({
  sections,
  currency,
  grandTotal,
}: NotebookRunningTotalProps) {
  return (
    <div className="mt-8 pt-4 border-t-2 border-double border-neutral-400">
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.label}
            className="flex justify-between items-center"
          >
            <span className="font-handwriting text-neutral-600">
              {section.label}
            </span>
            <div className="flex-1 mx-4 border-b border-dotted border-neutral-300" />
            <span
              className={cn("font-handwriting text-lg tabular-nums", section.colorClass)}
            >
              {formatCurrency(section.total, currency)}
            </span>
          </div>
        ))}

        {/* Grand total with double underline */}
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-neutral-300">
          <span className="font-serif font-bold text-neutral-900">
            Total Monthly
          </span>
          <span className="font-handwriting text-2xl text-neutral-900 underline decoration-double decoration-2">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
