"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, Loader2, ArrowUp, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { BucketChip } from "./bucket-chip";
import { CategoryChip } from "./category-chip";
import type { BudgetBucket } from "@repo/database";

interface ExpensePreview {
  amount: number;
  label: string;
  category?: string;
  bucketId?: string;
  bucketSlug?: string;
}

interface CompactSmartInputProps {
  onAddExpenses: (expenses: ExpensePreview[]) => void;
  preview: ExpensePreview[];
  isParsing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  buckets?: BudgetBucket[];
  categories?: string[];
  onPreviewUpdate?: (index: number, updates: Partial<ExpensePreview>) => void;
  onCreateCategory?: (name: string) => void;
}

export function CompactSmartInput({
  preview,
  isParsing,
  onInputChange,
  onSubmit,
  placeholder = "coffee 120, lunch and grab...",
  autoFocus = false,
  buckets = [],
  categories = [],
  onPreviewUpdate,
  onCreateCategory,
}: CompactSmartInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onInputChange(newValue);
    },
    [onInputChange]
  );

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isParsing) return;
    onSubmit(value);
    setValue("");
    setIsExpanded(false);
  }, [value, isParsing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setValue("");
        onInputChange("");
        inputRef.current?.blur();
        setIsExpanded(false);
      }
    },
    [handleSubmit, onInputChange]
  );

  const clearInput = useCallback(() => {
    setValue("");
    onInputChange("");
    inputRef.current?.focus();
  }, [onInputChange]);

  const totalPreview = preview.reduce((sum, p) => sum + p.amount, 0);

  // Collapsed state - show button
  if (!isExpanded) {
    return (
      <button
        onClick={() => {
          setIsExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full px-4 py-2.5 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center gap-2 text-neutral-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50/50 transition-all"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Add Expense</span>
      </button>
    );
  }

  // Expanded state - show input
  return (
    <div className="space-y-2">
      {/* Preview chips */}
      {preview.length > 0 && (
        <div className="space-y-1.5">
          {preview.map((expense, index) => (
            <div
              key={`${expense.label}-${index}`}
              className={cn(
                "flex items-center gap-1.5 p-1.5 rounded-lg",
                "bg-teal-50/70 border border-teal-200/40",
                "animate-in fade-in zoom-in-95 duration-200"
              )}
            >
              <div className="flex-1 flex items-center gap-1 min-w-0">
                <span className="text-teal-700 font-medium text-xs truncate">{expense.label}</span>
                <span className="text-teal-500/80 text-[10px] flex-shrink-0">
                  {CURRENCY}{expense.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {buckets.length > 0 && (
                  <BucketChip
                    buckets={buckets}
                    selectedSlug={expense.bucketSlug}
                    onSelect={(bucket) => {
                      onPreviewUpdate?.(index, {
                        bucketId: bucket.id,
                        bucketSlug: bucket.slug,
                      });
                    }}
                    size="sm"
                  />
                )}
                <CategoryChip
                  categories={categories}
                  selectedCategory={expense.category}
                  onSelect={(category) => {
                    onPreviewUpdate?.(index, { category: category || undefined });
                  }}
                  onCreateNew={onCreateCategory}
                  size="sm"
                />
              </div>
            </div>
          ))}
          {preview.length > 1 && (
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-500">
              = {CURRENCY}{totalPreview.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div
        className={cn(
          "flex items-center gap-2 p-2",
          "bg-white/80 backdrop-blur-sm",
          "border rounded-xl",
          "transition-all duration-200",
          isFocused ? "border-teal-300 shadow-sm shadow-teal-100" : "border-neutral-200"
        )}
      >
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg",
            "flex items-center justify-center",
            "transition-all duration-200",
            isFocused
              ? "bg-teal-100 text-teal-600"
              : "bg-neutral-100 text-neutral-400"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "flex-1 min-w-0",
            "bg-transparent",
            "text-neutral-800 text-sm",
            "placeholder:text-neutral-400/70",
            "outline-none",
            "caret-teal-500"
          )}
        />

        {value && (
          <button
            onClick={clearInput}
            className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isParsing}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg",
            "flex items-center justify-center",
            "transition-all duration-200",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            value.trim() && !isParsing
              ? "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95"
              : "bg-neutral-100 text-neutral-400"
          )}
        >
          {isParsing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Cancel button */}
      <button
        onClick={() => {
          setValue("");
          onInputChange("");
          setIsExpanded(false);
        }}
        className="w-full text-xs text-neutral-400 hover:text-neutral-600 py-1"
      >
        Cancel
      </button>

      {/* Hint */}
      <p className="text-[10px] text-neutral-400 text-center">
        Try: &quot;coffee 120&quot; • &quot;:flex&quot; for bucket • &quot;#travel&quot; for category
      </p>
    </div>
  );
}
