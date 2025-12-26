"use client";

import { useState, useRef, useEffect } from "react";
import { Tag, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  categories: string[];
  selectedCategory?: string;
  onSelect: (category: string) => void;
  onCreateNew?: (name: string) => void;
  size?: "sm" | "md";
}

export function CategoryChip({
  categories,
  selectedCategory,
  onSelect,
  onCreateNew,
  size = "sm",
}: CategoryChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewCategory("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateSubmit = () => {
    const trimmed = newCategory.trim();
    if (trimmed) {
      onCreateNew?.(trimmed);
      onSelect(trimmed);
      setNewCategory("");
      setIsCreating(false);
      setIsOpen(false);
    }
  };

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
          selectedCategory
            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            : "bg-stone-50 text-stone-500 border-dashed border-stone-300 hover:border-stone-400"
        )}
      >
        <Tag className={cn(size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3")} />
        <span className="font-medium truncate max-w-[60px]">
          {selectedCategory ?? "Category"}
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
          {isCreating ? (
            <div className="px-2 py-1">
              <input
                ref={inputRef}
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateSubmit();
                  }
                  if (e.key === "Escape") {
                    setIsCreating(false);
                    setNewCategory("");
                  }
                }}
                placeholder="Category name"
                className={cn(
                  "w-full px-2 py-1.5 text-xs rounded border border-stone-200",
                  "focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                )}
              />
              <div className="flex gap-1 mt-1">
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  className="flex-1 px-2 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCategory("");
                  }}
                  className="flex-1 px-2 py-1 text-[10px] bg-stone-100 text-stone-600 rounded hover:bg-stone-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Clear selection option */}
              {selectedCategory && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs flex items-center gap-2",
                    "hover:bg-stone-50 transition-colors text-stone-400"
                  )}
                >
                  <span className="italic">Clear category</span>
                </button>
              )}

              {/* Existing categories */}
              {categories.length === 0 && !selectedCategory ? (
                <div className="px-3 py-2 text-xs text-stone-400">No categories yet</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(category);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-xs flex items-center gap-2",
                      "hover:bg-stone-50 transition-colors",
                      selectedCategory === category && "bg-stone-50 font-medium"
                    )}
                  >
                    <Tag className="w-2.5 h-2.5 text-amber-500" />
                    <span className="truncate">{category}</span>
                  </button>
                ))
              )}

              {/* Add new category */}
              {onCreateNew && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreating(true);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs flex items-center gap-2",
                    "hover:bg-stone-50 transition-colors text-amber-600 border-t border-stone-100"
                  )}
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add new</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
