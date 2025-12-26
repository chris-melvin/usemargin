"use client";

import { useState, useRef, useEffect } from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetBucket } from "@repo/database";

interface BucketChipProps {
  buckets: BudgetBucket[];
  selectedSlug?: string;
  onSelect: (bucket: BudgetBucket) => void;
  size?: "sm" | "md";
}

export function BucketChip({
  buckets,
  selectedSlug,
  onSelect,
  size = "sm",
}: BucketChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBucket = buckets.find((b) => b.slug === selectedSlug);

  // Show the slug even if bucket not found in list (user typed unmatched :bucket)
  const displayName = selectedBucket?.name ?? (selectedSlug ? `:${selectedSlug}` : null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-1 rounded-full border transition-all",
          "hover:shadow-sm active:scale-95",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
          selectedBucket
            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            : selectedSlug
            ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" // Unmatched bucket
            : "bg-stone-50 text-stone-500 border-dashed border-stone-300 hover:border-stone-400"
        )}
        style={
          selectedBucket?.color
            ? {
                backgroundColor: `${selectedBucket.color}15`,
                borderColor: `${selectedBucket.color}40`,
                color: selectedBucket.color,
              }
            : undefined
        }
      >
        <Wallet className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
        <span className="font-medium truncate max-w-[60px]">
          {displayName ?? "Bucket"}
        </span>
        <ChevronDown
          className={cn(
            "transition-transform",
            size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[140px]",
            "bg-white rounded-lg shadow-lg border border-stone-200",
            "py-1 animate-in fade-in slide-in-from-top-1 duration-150"
          )}
        >
          {buckets.length === 0 ? (
            <div className="px-3 py-2 text-xs text-stone-400">No buckets</div>
          ) : (
            buckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(bucket);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs flex items-center gap-2",
                  "hover:bg-stone-50 transition-colors",
                  selectedSlug === bucket.slug && "bg-stone-50 font-medium"
                )}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: bucket.color ?? "#a8a29e" }}
                />
                <span className="truncate">{bucket.name}</span>
                {bucket.is_default && (
                  <span className="text-[9px] text-stone-400 ml-auto">default</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
